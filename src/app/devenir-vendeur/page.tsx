"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AFRICAN_COUNTRIES } from "@/data/countries";
import { DRC_PROVINCES } from "@/data/provinces";
import { getPayoutConfigForCountry } from "@/data/vendor";
import { useT } from "@/i18n";

export default function DevenirVendeurPage() {
  const { t } = useT();
  const [formState, setFormState] = useState({
    countryCode: "CD",
    full_name: "",
    shop_name: "",
    category: "",
    location: "",
    phone: "",
    email: "",
    terms: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const selectedCountry =
    AFRICAN_COUNTRIES.find((c) => c.code.toUpperCase() === formState.countryCode.toUpperCase()) ||
    AFRICAN_COUNTRIES[0];

  const payoutConfig = getPayoutConfigForCountry(selectedCountry.code);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setFormState((prev) => ({
      ...prev,
      countryCode: newCountryCode,
      location: "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Header />
      <main className="flex-grow">
        {/* ─── HERO ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20 bg-gradient-to-b from-surface-container-low/60 to-background border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left column */}
              <div className="lg:col-span-6 flex flex-col items-start space-y-5">
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest/60 border border-secondary/20 text-on-secondary-fixed text-[10px] font-bold tracking-widest uppercase shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  {t("become_seller.badge_network")}
                </div>

                {/* Headline */}
                <h1 className="text-3xl md:text-[40px] font-black text-primary tracking-tight leading-tight font-display">
                  {t("become_seller.hero_title")}
                </h1>

                {/* Subtitle */}
                <p className="text-xl font-bold text-secondary leading-snug font-display">
                  {t("become_seller.hero_subtitle")}
                </p>

                {/* Body */}
                <p className="text-base text-on-surface-variant leading-relaxed max-w-xl">
                  {t("become_seller.hero_body")}
                </p>

                {/* CTA Cluster */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 w-full sm:w-auto">
                  <a
                    href="#inscription-vendeur"
                    className="inline-flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white px-7 py-3.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 focus:ring-4 focus:ring-orange-300"
                  >
                    <span className="material-symbols-outlined text-lg">storefront</span>
                    <span>{t("become_seller.cta_become_seller")}</span>
                  </a>
                  <a
                    href="#avantages"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-outline-variant hover:border-secondary hover:bg-surface-container-low text-on-surface px-5 py-3.5 rounded-lg font-semibold text-sm transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg text-secondary">monitoring</span>
                    <span>{t("become_seller.cta_discover_benefits")}</span>
                  </a>
                </div>

                {/* Micro stats */}
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-outline-variant/60 w-full max-w-lg">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-primary">+2 450</span>
                    <span className="text-xs text-on-surface-variant">{t("become_seller.stat_active_shops")}</span>
                  </div>
                  <div className="flex flex-col border-x border-outline-variant/50 px-3">
                    <span className="text-base font-bold text-secondary">24h</span>
                    <span className="text-xs text-on-surface-variant">{t("become_seller.stat_payout_delay")}</span>
                  </div>
                  <div className="flex flex-col pl-2">
                    <span className="text-base font-bold text-primary">98%</span>
                    <span className="text-xs text-on-surface-variant">{t("become_seller.stat_satisfaction")}</span>
                  </div>
                </div>
              </div>

              {/* Right column — hero image */}
              <div className="lg:col-span-6 relative mt-4 lg:mt-0">
                <div className="relative mx-auto max-w-lg lg:max-w-none">
                  {/* Glow frame */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-secondary/15 via-transparent to-[#EA580C]/20 rounded-2xl blur-lg"></div>
                  {/* Image container */}
                  <div className="relative bg-white rounded-xl border border-outline-variant overflow-hidden shadow-xl aspect-square flex items-center justify-center">
                    <Image
                      alt="Commerçante gérant sa boutique artisanale sur Mwinda Market"
                      className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvJGhV3PP8mr8ksxOvLbpmF5aNKq8zDXxYQouEBMvQ_ROCIogzOvanxbdoBjdzN9jmVWWv_dknhTODRSaWopL5T7YJN5W38gC2O3n0_cKPsS9VteTwt9-6OWUdyisz6tzTtmdeBUrQ9r5RRncBF5o64o08njxablsAs4OH6lfMIBZgyHcbyVOl1Qg71jKvz3s0K4rY-aHIFLRm1ucxoEVEtizI_BFNxTr7kQegO8YJD2hihu8a8FpA"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />

                    {/* Badge top-left: boutique certifiée */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-outline-variant shadow-md flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-secondary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-primary leading-none">
                          {t("become_seller.badge_certified_shop")}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">Kinshasa • Mode & Wax</p>
                      </div>
                    </div>

                    {/* Badge bottom-right: monthly revenue */}
                    <div className="absolute bottom-4 right-4 bg-primary-container/95 text-white backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/10 shadow-lg flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EA580C] flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-xl">trending_up</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                          {t("become_seller.badge_monthly_sales")}
                        </span>
                        <span className="text-base font-black text-white">+4 800 $</span>
                      </div>
                    </div>

                    {/* Express pill */}
                    <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-1.5 bg-secondary-fixed text-on-secondary-fixed px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm border border-secondary/30">
                      <span className="material-symbols-outlined text-sm">flight_takeoff</span>
                      <span>{t("become_seller.badge_hub_express")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── AVANTAGES ───────────────────────────────────────────── */}
        <section
          id="avantages"
          className="py-16 bg-white border-b border-outline-variant"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10">
            {/* Section header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
                {t("become_seller.benefits_eyebrow")}
              </span>
              <h2 className="text-2xl md:text-[32px] font-bold text-primary mt-1 font-display tracking-tight">
                {t("become_seller.benefits_title")}
              </h2>
              <p className="text-base text-on-surface-variant mt-2 leading-relaxed">
                {t("become_seller.benefits_desc")}
              </p>
            </div>

            {/* 4-card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="bg-surface rounded-xl p-6 border border-outline-variant hover:border-secondary/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.benefit1_title")}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {t("become_seller.benefit1_desc")}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center text-secondary text-xs font-semibold">
                  <span>{t("become_seller.benefit1_link")}</span>
                  <span className="material-symbols-outlined text-base ml-1">chevron_right</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-surface rounded-xl p-6 border border-outline-variant hover:border-secondary/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">lock</span>
                  </div>
                  <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.benefit2_title")}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {t("become_seller.benefit2_desc")}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center text-secondary text-xs font-semibold">
                  <span>{t("become_seller.benefit2_link")}</span>
                  <span className="material-symbols-outlined text-base ml-1">chevron_right</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-surface rounded-xl p-6 border border-outline-variant hover:border-secondary/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">local_shipping</span>
                  </div>
                  <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.benefit3_title")}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {t("become_seller.benefit3_desc")}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center text-secondary text-xs font-semibold">
                  <span>{t("become_seller.benefit3_link")}</span>
                  <span className="material-symbols-outlined text-base ml-1">chevron_right</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-surface rounded-xl p-6 border border-outline-variant hover:border-secondary/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center text-primary-container mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">dashboard</span>
                  </div>
                  <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.benefit4_title")}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {t("become_seller.benefit4_desc")}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center text-secondary text-xs font-semibold">
                  <span>{t("become_seller.benefit4_link")}</span>
                  <span className="material-symbols-outlined text-base ml-1">chevron_right</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────── */}
        <section className="py-16 bg-surface-container-low/50 border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
                {t("become_seller.process_eyebrow")}
              </span>
              <h2 className="text-2xl md:text-[32px] font-bold text-primary mt-1 font-display tracking-tight">
                {t("become_seller.process_title")}
              </h2>
              <p className="text-base text-on-surface-variant mt-2 leading-relaxed">
                {t("become_seller.process_desc")}
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Horizontal connector line (desktop) */}
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-outline-variant/60 -z-0"></div>

              {/* Step 1 */}
              <div className="relative z-10 bg-white rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-primary-container text-white font-black text-base flex items-center justify-center ring-4 ring-background mb-5 shadow-lg">
                  1
                </div>
                <span className="inline-block px-2.5 py-0.5 bg-surface-container-high text-secondary text-[10px] font-bold rounded-full mb-3">
                  {t("become_seller.step1_badge")}
                </span>
                <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.step1_title")}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {t("become_seller.step1_desc")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 bg-white rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-secondary text-white font-black text-base flex items-center justify-center ring-4 ring-background mb-5 shadow-lg">
                  2
                </div>
                <span className="inline-block px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full mb-3">
                  {t("become_seller.step2_badge")}
                </span>
                <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.step2_title")}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {t("become_seller.step2_desc")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 bg-white rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-[#EA580C] text-white font-black text-base flex items-center justify-center ring-4 ring-background mb-5 shadow-lg">
                  3
                </div>
                <span className="inline-block px-2.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold rounded-full mb-3">
                  {t("become_seller.step3_badge")}
                </span>
                <h3 className="text-base font-semibold text-primary mb-2">{t("become_seller.step3_title")}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {t("become_seller.step3_desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FORMULAIRE D'INSCRIPTION ────────────────────────────── */}
        <section id="inscription-vendeur" className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-10">
            {submitted ? (
              /* Success state avec détails pays et devise de règlement */
              <div className="bg-white rounded-2xl border border-outline-variant shadow-lg p-8 sm:p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span
                    className="material-symbols-outlined text-4xl text-green-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2 font-display">
                  {t("become_seller.success_title")}
                </h2>
                <p className="text-base text-on-surface-variant mb-6 leading-relaxed max-w-lg mx-auto">
                  {t("become_seller.success_desc")}
                </p>

                {/* Récapitulatif pays & devise de règlement */}
                <div className="max-w-md mx-auto mb-8 p-5 bg-surface-container-low rounded-xl border border-outline-variant text-left space-y-3">
                  <div className="flex justify-between items-center pb-2.5 border-b border-outline-variant/60 text-xs">
                    <span className="font-semibold text-on-surface-variant">{t("become_seller.label_shop_name")} :</span>
                    <span className="font-bold text-primary">{formState.shop_name} ({formState.full_name})</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-outline-variant/60 text-xs">
                    <span className="font-semibold text-on-surface-variant">{t("become_seller.registered_country")}</span>
                    <span className="font-bold text-secondary flex items-center gap-1.5">
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.name.fr} ({selectedCountry.code})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-outline-variant/60 text-xs">
                    <span className="font-semibold text-on-surface-variant">{t("become_seller.registered_region")}</span>
                    <span className="font-bold text-primary">{formState.location || "Principale"}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-outline-variant/60 text-xs">
                    <span className="font-semibold text-on-surface-variant">{t("become_seller.payout_currency_label")}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedCountry.currency.code} ({selectedCountry.currency.symbol} - {selectedCountry.currency.name})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-on-surface-variant">{t("become_seller.payout_method_label")}</span>
                    <span className="font-medium text-primary text-right max-w-[220px]">
                      {payoutConfig.hasMobileMoney
                        ? `Mobile Money (${payoutConfig.mobileMoneyOperators.slice(0, 2).map((o) => o.split(" ")[0]).join(", ")})`
                        : t("become_seller.payout_bank_transfer")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/vendeur/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white px-6 py-3 rounded-lg font-semibold text-sm shadow-md transition"
                  >
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    {t("become_seller.btn_dashboard")}
                  </Link>
                  <Link
                    href="/boutiques"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-slate-800 transition"
                  >
                    <span className="material-symbols-outlined text-base">storefront</span>
                    {t("become_seller.btn_view_shops")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="inline-flex items-center justify-center gap-2 border border-outline-variant text-on-surface px-6 py-3 rounded-lg font-semibold text-sm hover:bg-surface-container-low transition"
                  >
                    <span className="material-symbols-outlined text-base">restart_alt</span>
                    {t("become_seller.btn_new_request")}
                  </button>
                </div>
              </div>
            ) : (
              /* Registration form */
              <div className="bg-white rounded-2xl border border-outline-variant shadow-lg p-6 sm:p-10">
                {/* Form header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EA580C]/10 text-[#EA580C] mb-3">
                    <span className="material-symbols-outlined text-3xl">app_registration</span>
                  </div>
                  <h2 className="text-2xl md:text-[28px] font-bold text-primary font-display">
                    {t("become_seller.form_title")}
                  </h2>
                  <p className="text-base text-on-surface-variant mt-2 max-w-xl mx-auto leading-relaxed">
                    {t("become_seller.form_desc")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: Pays d'expédition (en premier) & Région / Province adaptée */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Pays d'expédition */}
                    <div>
                      <label
                        htmlFor="countryCode"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_shipping_country")} <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="countryCode"
                          name="countryCode"
                          required
                          value={formState.countryCode}
                          onChange={handleCountryChange}
                          className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none appearance-none transition"
                        >
                          {AFRICAN_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name.fr} ({c.currency.code})
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg pointer-events-none">
                          public
                        </span>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-lg pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Province / Région / Ville (s'adapte au pays sélectionné) */}
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_location")} <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        {selectedCountry.code.toUpperCase() === "CD" ? (
                          /* RDC : 26 provinces */
                          <>
                            <select
                              id="location"
                              name="location"
                              required
                              value={formState.location}
                              onChange={handleChange}
                              className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none appearance-none transition"
                            >
                              <option value="" disabled>
                                {t("become_seller.select_location")}
                              </option>
                              {DRC_PROVINCES.map((prov) => (
                                <option key={prov.id} value={`${prov.name} (${prov.capital})`}>
                                  {prov.name} — {prov.capital}
                                </option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg pointer-events-none">
                              pin_drop
                            </span>
                            <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-lg pointer-events-none">
                              expand_more
                            </span>
                          </>
                        ) : selectedCountry.regions && selectedCountry.regions.length > 0 ? (
                          /* Pays avec régions prévues */
                          <>
                            <select
                              id="location"
                              name="location"
                              required
                              value={formState.location}
                              onChange={handleChange}
                              className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none appearance-none transition"
                            >
                              <option value="" disabled>
                                {t("become_seller.select_location")}
                              </option>
                              {selectedCountry.regions.map((reg) => (
                                <option key={reg.id} value={reg.name}>
                                  {reg.name}
                                </option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg pointer-events-none">
                              pin_drop
                            </span>
                            <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-lg pointer-events-none">
                              expand_more
                            </span>
                          </>
                        ) : (
                          /* Autres pays : champ ville/région libre */
                          <>
                            <input
                              id="location"
                              name="location"
                              type="text"
                              required
                              value={formState.location}
                              onChange={handleChange}
                              placeholder={t("become_seller.placeholder_free_city")}
                              className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg pointer-events-none">
                              location_city
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Nom complet & Nom boutique */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full name */}
                    <div>
                      <label
                        htmlFor="full_name"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_full_name")} <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="full_name"
                          name="full_name"
                          type="text"
                          required
                          value={formState.full_name}
                          onChange={handleChange}
                          placeholder={t("become_seller.placeholder_full_name")}
                          className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg">
                          person
                        </span>
                      </div>
                    </div>

                    {/* Shop name */}
                    <div>
                      <label
                        htmlFor="shop_name"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_shop_name")} <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="shop_name"
                          name="shop_name"
                          type="text"
                          required
                          value={formState.shop_name}
                          onChange={handleChange}
                          placeholder={t("become_seller.placeholder_shop_name")}
                          className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg">
                          store
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Catégorie & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Category */}
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_category")} <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="category"
                          name="category"
                          required
                          value={formState.category}
                          onChange={handleChange}
                          className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none appearance-none transition"
                        >
                          <option value="" disabled>
                            {t("become_seller.select_category")}
                          </option>
                          <option value="mode">{t("become_seller.cat_fashion")}</option>
                          <option value="electronique">{t("become_seller.cat_electronics")}</option>
                          <option value="maison">{t("become_seller.cat_home")}</option>
                          <option value="beaute">{t("become_seller.cat_beauty")}</option>
                          <option value="alimentation">{t("become_seller.cat_food")}</option>
                          <option value="autres">{t("become_seller.cat_other")}</option>
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg pointer-events-none">
                          category
                        </span>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-lg pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_email")} <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formState.email}
                          onChange={handleChange}
                          placeholder="contact@votre-boutique.cd"
                          className="w-full h-11 px-3.5 pl-10 rounded-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg">
                          mail
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Téléphone Mobile Money adapté au pays */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Phone avec préfixe pays dynamique */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-semibold text-primary mb-1.5"
                      >
                        {t("become_seller.label_phone")} <span className="text-error">*</span>
                      </label>
                      <div className="relative flex">
                        <div className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-high text-sm text-on-surface font-semibold shrink-0">
                          {selectedCountry.phoneCode}
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={formState.phone}
                          onChange={handleChange}
                          placeholder="81 234 5678"
                          className="w-full h-11 px-3.5 rounded-r-lg border border-outline-variant bg-white text-on-surface text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
                        />
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        {t("become_seller.hint_phone")}
                      </p>
                    </div>

                    {/* Logo upload (optionnel) */}
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">
                        {t("become_seller.label_logo")}{" "}
                        <span className="text-on-surface-variant font-normal">{t("cart.optional") || "(optionnel)"}</span>
                      </label>
                      <div className="border-2 border-dashed border-outline-variant rounded-lg p-2.5 text-center hover:border-secondary transition-colors bg-surface-container-low/40 cursor-pointer">
                        <p className="text-xs text-on-surface-variant">
                          {t("become_seller.drop_logo")}{" "}
                          <span className="text-secondary font-semibold cursor-pointer hover:underline">
                            {t("become_seller.browse")}
                          </span>
                        </p>
                        <p className="text-[10px] text-outline mt-0.5">{t("become_seller.logo_format")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bandeau d'information : Devise de règlement et mode de versement du pays */}
                  <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        payments
                      </span>
                      <div>
                        <span className="font-bold text-primary">{t("become_seller.payout_currency_label")} </span>
                        <strong className="text-secondary font-mono">
                          {selectedCountry.currency.code} ({selectedCountry.currency.symbol} - {selectedCountry.currency.name})
                        </strong>
                      </div>
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      <span className="font-semibold text-primary">{t("become_seller.payout_method_label")} </span>
                      <span className="font-medium text-emerald-800">
                        {payoutConfig.hasMobileMoney ? payoutConfig.settlementMethodKey : t("become_seller.payout_bank_transfer")}
                      </span>
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="pt-1 flex items-start gap-3">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      checked={formState.terms}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 rounded border-outline text-secondary focus:ring-secondary"
                    />
                    <label htmlFor="terms" className="text-sm text-on-surface-variant leading-relaxed">
                      {t("become_seller.terms_text_before")}{" "}
                      <Link href="/conditions" className="text-secondary hover:underline font-medium">
                        {t("become_seller.terms_link")}
                      </Link>{" "}
                      {t("become_seller.terms_text_after")}
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 focus:ring-4 focus:ring-orange-300"
                    >
                      <span className="material-symbols-outlined text-xl">verified_user</span>
                      <span>{t("become_seller.btn_submit")}</span>
                    </button>
                  </div>

                  {/* Trust notice */}
                  <div className="flex items-center justify-center gap-2 text-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-base">shield</span>
                    <span>
                      {t("become_seller.trust_footer")}
                    </span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* ─── RÉASSURANCE (TÉMOIGNAGES + STATS) ──────────────────── */}
        <section className="py-14 bg-surface-container-low/60 border-t border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10">
            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 text-center">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-primary font-display">+2 450</span>
                <span className="text-sm text-on-surface-variant mt-1">{t("become_seller.certified_vendors_stat")}</span>
              </div>
              <div className="flex flex-col border-outline-variant/40 md:border-x px-4">
                <span className="text-3xl font-black text-secondary font-display">26</span>
                <span className="text-sm text-on-surface-variant mt-1">{t("become_seller.provinces_covered_stat")}</span>
              </div>
              <div className="flex flex-col border-outline-variant/40 md:border-r px-4">
                <span className="text-3xl font-black text-[#EA580C] font-display">98%</span>
                <span className="text-sm text-on-surface-variant mt-1">{t("become_seller.stat_satisfaction")}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-primary font-display">24h</span>
                <span className="text-sm text-on-surface-variant mt-1">{t("become_seller.validation_delay_stat")}</span>
              </div>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  name: "Aline Nzuzi",
                  shop: "Maison Nzuzi Wax • Kinshasa",
                  quote:
                    "J'ai lancé ma boutique mode en 48h seulement. En 3 mois, je vends maintenant dans 5 provinces différentes grâce à Mwinda Express !",
                  rating: 5,
                },
                {
                  name: "Bienvenu Kabila",
                  shop: "Kazi Tech Electronics • Lubumbashi",
                  quote:
                    "Les paiements Mobile Money sont virés le lendemain. Plus de risque d'impayé, je peux gérer mon stock sereinement depuis mon tableau de bord.",
                  rating: 5,
                },
                {
                  name: "Grâce Mutombo",
                  shop: "Saveurs du Kivu • Bukavu",
                  quote:
                    "Le conseiller dédié m'a aidé à importer tout mon catalogue en une journée. Mes produits locaux sont maintenant accessibles depuis Kinshasa !",
                  rating: 5,
                },
              ].map((tItem, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: tItem.rating }).map((_, s) => (
                      <span
                        key={s}
                        className="material-symbols-outlined text-[#EA580C] text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-sm text-on-surface-variant leading-relaxed italic mb-4">
                    &ldquo;{tItem.quote}&rdquo;
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/40">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm">
                      {tItem.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{tItem.name}</p>
                      <p className="text-xs text-on-surface-variant">{tItem.shop}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final CTA banner */}
            <div className="mt-12 rounded-2xl bg-primary-container text-white p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 via-transparent to-[#EA580C]/20 pointer-events-none"></div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 font-display relative z-10">
                {t("become_seller.final_cta_title")}
              </h2>
              <p className="text-sm text-slate-300 mb-6 max-w-xl mx-auto relative z-10">
                {t("become_seller.final_cta_desc")}
              </p>
              <a
                href="#inscription-vendeur"
                className="relative z-10 inline-flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white px-8 py-3.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                <span>{t("become_seller.start_free")}</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
