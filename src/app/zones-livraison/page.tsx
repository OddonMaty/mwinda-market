"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";
import { getActiveCountries, getCountryByCode } from "@/lib/activeCountries";
import { DRC_PROVINCES, Province } from "@/data/provinces";
import { convertUsdToCurrency, formatLocalPrice } from "@/lib/currency";
import { SHOPS_DATA } from "@/data/shops";
import { CountryRegion } from "@/data/countries";

export default function ZonesLivraisonPage() {
  const { country: globalCountry } = useMarket();
  const { t, language } = useT();

  // Liste des pays actifs (ceux avec au moins une boutique)
  const activeCountries = useMemo(() => getActiveCountries(SHOPS_DATA), []);

  // Onglet pays sélectionné sur la page (par défaut le pays du marché actif)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => {
    const isGlobalActive = activeCountries.some(
      (c) => c.code.toUpperCase() === globalCountry.code.toUpperCase()
    );
    return isGlobalActive ? globalCountry.code : activeCountries[0]?.code || "CD";
  });

  // Métadonnées du pays consulté
  const viewedCountry = useMemo(() => {
    return getCountryByCode(selectedCountryCode) || activeCountries[0] || globalCountry;
  }, [selectedCountryCode, activeCountries, globalCountry]);

  // Régions disponibles pour le pays consulté
  const countryRegions = useMemo(() => {
    if (viewedCountry.code === "CD") {
      return DRC_PROVINCES;
    }
    return (viewedCountry.regions || []) as CountryRegion[];
  }, [viewedCountry]);

  // Filtre de zone pour la RDC
  const [selectedZone, setSelectedZone] = useState<string>("all");

  // Champ de recherche textuelle
  const [searchQuery, setSearchQuery] = useState<string>("");

  // État du simulateur de frais
  const [originRegionId, setOriginRegionId] = useState<string>(() => {
    return countryRegions[0]?.id || "kin";
  });
  const [destRegionId, setDestRegionId] = useState<string>(() => {
    return countryRegions[1]?.id || countryRegions[0]?.id || "koc";
  });

  // Mettre à jour les sélections du simulateur lorsque le pays change
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    setSelectedZone("all");
    setSearchQuery("");
    const newCountry = getCountryByCode(code);
    const newRegions = newCountry?.code === "CD" ? DRC_PROVINCES : newCountry?.regions || [];
    if (newRegions.length > 0) {
      setOriginRegionId(newRegions[0].id);
      setDestRegionId(newRegions.length > 1 ? newRegions[1].id : newRegions[0].id);
    }
  };

  // Filtrage des territoires affichés
  const filteredProvinces = useMemo(() => {
    if (viewedCountry.code === "CD") {
      return DRC_PROVINCES.filter((province) => {
        // Filtre par zone
        let matchZone = true;
        if (selectedZone === "kinshasa-ouest") {
          matchZone = province.zone === "Kinshasa" || province.zone === "Ouest";
        } else if (selectedZone === "katanga") {
          matchZone = province.zone === "Grand Katanga";
        } else if (selectedZone === "kivu") {
          matchZone = province.zone === "Grand Kivu";
        } else if (selectedZone === "kasai") {
          matchZone = province.zone === "Grand Kasaï";
        } else if (selectedZone === "equateur") {
          matchZone = province.zone === "Grand Équateur" || province.zone === "Nord-Est";
        }

        // Filtre par recherche textuelle
        let matchSearch = true;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          matchSearch =
            province.name.toLowerCase().includes(q) ||
            province.capital.toLowerCase().includes(q) ||
            province.hub.toLowerCase().includes(q) ||
            province.zone.toLowerCase().includes(q);
        }

        return matchZone && matchSearch;
      });
    }

    // Autres pays actifs
    return countryRegions.filter((region) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        region.name.toLowerCase().includes(q) ||
        (region.capital && region.capital.toLowerCase().includes(q)) ||
        (region.hub && region.hub.toLowerCase().includes(q))
      );
    });
  }, [viewedCountry, selectedZone, searchQuery, countryRegions]);

  // Calcul du simulateur de frais
  const simulationResult = useMemo(() => {
    const isSameRegion = originRegionId === destRegionId;
    const baseFeeUsd = isSameRegion ? 6 : 18;
    const localFee = convertUsdToCurrency(baseFeeUsd, viewedCountry.currency.code);
    const formattedLocal = formatLocalPrice(
      localFee,
      viewedCountry.currency.code,
      viewedCountry.currency.symbol
    );
    const delay = isSameRegion ? "24h - 48h" : "48h - 72h";
    const zoneName = isSameRegion
      ? t("delivery_zones.simulator_zone_local")
      : t("delivery_zones.simulator_zone_national");

    return {
      isSameRegion,
      baseFeeUsd,
      formattedLocal,
      delay,
      zoneName,
    };
  }, [originRegionId, destRegionId, viewedCountry, t]);

  // Boutiques par territoire
  const getShopsCountForTerritory = (territoryName: string) => {
    return SHOPS_DATA.filter((s) => {
      const matchCountry = (s.countryCode || "CD").toUpperCase() === viewedCountry.code.toUpperCase();
      const matchProvince =
        s.province && s.province.toLowerCase().includes(territoryName.toLowerCase());
      const matchCity = s.city && s.city.toLowerCase().includes(territoryName.toLowerCase());
      return matchCountry && (matchProvince || matchCity);
    }).length;
  };

  const currentCountryName =
    language === "en" ? viewedCountry.name.en : viewedCountry.name.fr;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased selection:bg-secondary selection:text-white">
      <Header />

      {/* Breadcrumb Bar */}
      <nav aria-label="Fil d'Ariane" className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-xs sm:text-sm text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("header.home")}</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </li>
            <li>
              <span className="text-on-surface-variant font-medium">Logistique</span>
            </li>
            <li>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </li>
            <li aria-current="page" className="text-secondary font-bold">
              {t("delivery_zones.hero_title")}
            </li>
          </ol>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-[#132347] to-primary-container text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-outline-variant/30">
          {/* Ambient Lighting Orbs */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 -top-24 w-60 h-60 rounded-full bg-tertiary/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            {/* Reassurance Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-secondary-fixed text-xs sm:text-sm font-semibold mb-4 backdrop-blur-sm shadow-sm">
              <span className="material-symbols-outlined text-sm text-secondary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span>{t("delivery_zones.hero_tag")}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-white leading-tight">
              {t("delivery_zones.hero_title")} — {viewedCountry.flag} {currentCountryName}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/85 leading-relaxed mb-8">
              {t("delivery_zones.hero_subtitle")}
            </p>

            {/* Quick Live Search Bar */}
            <div className="relative w-full max-w-2xl bg-white rounded-xl p-1.5 shadow-2xl flex items-center border border-white/20 focus-within:ring-2 focus-within:ring-secondary transition-all">
              <div className="pl-3 pr-2 flex items-center text-outline">
                <span className="material-symbols-outlined text-xl text-secondary">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("delivery_zones.search_placeholder")}
                className="w-full bg-transparent border-none text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-0 placeholder:text-slate-400 py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-2 text-slate-400 hover:text-slate-600 transition"
                  aria-label="Effacer la recherche"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Bar Grid inside Hero */}
          <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {/* KPI 1 */}
            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 text-white">
                <span className="material-symbols-outlined text-xl">public</span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  {viewedCountry.code === "CD" ? "26 Provinces" : t("delivery_zones.kpi_coverage_title")}
                </div>
                <div className="text-xs text-white/70 mt-0.5">{t("delivery_zones.kpi_coverage_desc")}</div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-lg bg-tertiary/30 flex items-center justify-center shrink-0 text-white">
                <span className="material-symbols-outlined text-xl">schedule</span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  {t("delivery_zones.kpi_delay_title")}
                </div>
                <div className="text-xs text-white/70 mt-0.5">{t("delivery_zones.kpi_delay_desc")}</div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 text-white">
                <span className="material-symbols-outlined text-xl">hub</span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  {t("delivery_zones.kpi_hubs_title")}
                </div>
                <div className="text-xs text-white/70 mt-0.5">{t("delivery_zones.kpi_hubs_desc")}</div>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0 text-white">
                <span className="material-symbols-outlined text-xl">security</span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  {t("delivery_zones.kpi_security_title")}
                </div>
                <div className="text-xs text-white/70 mt-0.5">{t("delivery_zones.kpi_security_desc")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE COUNTRIES SELECTOR TABS */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">flag</span>
              <span className="text-sm font-bold text-primary uppercase tracking-wide">
                {t("delivery_zones.badge_active_markets")} ({activeCountries.length}) :
              </span>
            </div>
            <span className="text-xs text-on-surface-variant">
              Sélectionnez un pays pour consulter sa couverture locale
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {activeCountries.map((country) => {
              const isSelected = country.code.toUpperCase() === viewedCountry.code.toUpperCase();
              const countryName = language === "en" ? country.name.en : country.name.fr;
              const shopCount = SHOPS_DATA.filter(
                (s) => (s.countryCode || "CD").toUpperCase() === country.code.toUpperCase()
              ).length;

              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country.code)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 border ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-md scale-102"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant hover:border-secondary"
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span>{countryName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-secondary text-white"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {shopCount} {shopCount > 1 ? "boutiques" : "boutique"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CROSS-BORDER LOGISTICS NOTICE BANNER */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-2">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                {t("delivery_zones.cross_border_title")}
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-0.5 max-w-3xl leading-relaxed">
                {t("delivery_zones.cross_border_text")}
              </p>
            </div>
          </div>
          <Link
            href="/boutiques"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 shadow-sm"
          >
            <span>{t("delivery_zones.cross_border_cta")}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* DRC SPECIFIC ZONE FILTER CHIPS */}
      {viewedCountry.code === "CD" && (
        <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-outline-variant">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-on-surface">Zones RDC :</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedZone("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedZone === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {t("delivery_zones.tab_all_zones")} (26)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZone("kinshasa-ouest")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedZone === "kinshasa-ouest"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {t("delivery_zones.tab_zone_kinshasa")} (5)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZone("katanga")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedZone === "katanga"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {t("delivery_zones.tab_zone_katanga")} (4)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZone("kivu")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedZone === "kivu"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {t("delivery_zones.tab_zone_kivu")} (3)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZone("kasai")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedZone === "kasai"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {t("delivery_zones.tab_zone_kasai")} (5)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZone("equateur")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedZone === "equateur"
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {t("delivery_zones.tab_zone_equateur")} (9)
                </button>
              </div>
            </div>

            <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
              <span>Colis scellés &amp; délivrés contre code SMS unique</span>
            </div>
          </div>
        </section>
      )}

      {/* TERRITORY MATRIX GRID */}
      <main className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
              {t("delivery_zones.matrix_title")} — {viewedCountry.flag} {currentCountryName}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {t("delivery_zones.matrix_subtitle")}
            </p>
          </div>
          <span className="text-xs font-bold bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full">
            {filteredProvinces.length} {filteredProvinces.length > 1 ? "Régions recensées" : "Région recensée"}
          </span>
        </div>

        {filteredProvinces.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant p-8">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">location_off</span>
            <p className="text-base text-on-surface-variant font-medium">
              {t("delivery_zones.no_results")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProvinces.map((item, index) => {
              const isProvince = "capital" in item && "zone" in item;
              const prov = item as Province;
              const reg = item as CountryRegion;
              const name = isProvince ? prov.name : reg.name;
              const capital = isProvince ? prov.capital : reg.capital || reg.name;
              const hub = isProvince ? prov.hub : reg.hub || `Hub Principal ${reg.name}`;
              const delay = isProvince ? prov.delay : reg.delay || "24h - 48h";
              const isExpress = isProvince ? !!prov.isExpress : !!reg.isExpress;
              const shopsCount = getShopsCountForTerritory(name);

              return (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md hover:border-secondary transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Number & Name */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-outline tracking-wider uppercase">
                          {viewedCountry.code === "CD"
                            ? `Province ${String(index + 1).padStart(2, "0")}`
                            : `Région ${String(index + 1).padStart(2, "0")}`}
                        </span>
                        <h3 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors">
                          {name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold">
                        {capital}
                      </span>
                    </div>

                    {/* Logistics Badge */}
                    <div className="mb-4">
                      {isExpress ? (
                        <Badge
                          variant="express"
                          text={`${delay} • ${t("delivery_zones.badge_express")}`}
                        />
                      ) : (
                        <Badge
                          variant="interprovincial"
                          text={`${delay} • ${t("delivery_zones.badge_standard")}`}
                        />
                      )}
                    </div>

                    {/* Hub information */}
                    <div className="space-y-2 text-xs text-on-surface mb-4">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm text-secondary">hub</span>
                        <span className="font-semibold text-primary">{hub}</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm text-tertiary">store</span>
                        <span>
                          {shopsCount > 0 ? (
                            <span className="font-semibold text-emerald-600">
                              {shopsCount} {shopsCount > 1 ? "boutiques actives" : "boutique active"}
                            </span>
                          ) : (
                            <span className="text-outline">Desservi via hub régional</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer link to relay points */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Agences partenaires agréées</span>
                    <span className="text-secondary font-bold flex items-center gap-0.5">
                      <span>Points relais</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* SHIPPING FEE SIMULATOR */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 lg:p-10 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              {viewedCountry.flag} {currentCountryName}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1 tracking-tight">
              {t("delivery_zones.simulator_title")}
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 leading-relaxed">
              {t("delivery_zones.simulator_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Form Inputs */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-on-surface mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-base">outbox</span>
                    <span>{t("delivery_zones.simulator_origin")}</span>
                  </span>
                </label>
                <select
                  value={originRegionId}
                  onChange={(e) => setOriginRegionId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                >
                  {countryRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name} {("capital" in region && region.capital) ? `(${region.capital})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-on-surface mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-base">move_to_inbox</span>
                    <span>{t("delivery_zones.simulator_destination")}</span>
                  </span>
                </label>
                <select
                  value={destRegionId}
                  onChange={(e) => setDestRegionId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                >
                  {countryRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name} {("capital" in region && region.capital) ? `(${region.capital})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-outline text-sm">help_outline</span>
                <span>{t("delivery_zones.simulator_note")}</span>
              </p>
            </div>

            {/* Live Result Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-primary via-[#0f2142] to-primary text-white p-6 sm:p-7 rounded-2xl shadow-lg border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-fixed">
                    Résultat Estimation
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      simulationResult.isSameRegion
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-secondary/30 text-secondary-fixed border border-secondary/40"
                    }`}
                  >
                    {simulationResult.zoneName}
                  </span>
                </div>

                <div className="my-6">
                  <span className="text-xs text-white/70 block mb-1">
                    {t("delivery_zones.simulator_estimated_fee")}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {simulationResult.formattedLocal}
                    </span>
                    <span className="text-sm text-white/70 font-semibold">
                      (~{simulationResult.baseFeeUsd} $ USD)
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/15 space-y-2.5 text-xs text-white/85">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary-fixed">timer</span>
                      <span>{t("delivery_zones.simulator_estimated_time")} :</span>
                    </span>
                    <span className="font-bold text-white text-sm">
                      {simulationResult.delay}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary-fixed">check_circle</span>
                      <span>Protection Mwinda Pay :</span>
                    </span>
                    <span className="font-semibold text-emerald-300">Incluse</span>
                  </div>
                </div>
              </div>

              <Link
                href="/produits"
                className="mt-6 w-full py-3 bg-secondary hover:bg-secondary/90 text-white rounded-xl text-center text-xs sm:text-sm font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Faire des achats dans ce marché</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MULTIMODAL LOGISTICS SECTION */}
      <section id="hubs" className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 lg:p-10 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Logistique Intégrée Mwinda
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1 tracking-tight">
              {t("delivery_zones.multimodal_title")}
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 leading-relaxed">
              {t("delivery_zones.multimodal_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mode 1: Aérien */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col justify-between hover:border-secondary transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4 shadow">
                  <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-primary mb-1">
                  {t("delivery_zones.mode_air_title")}
                </h3>
                <p className="text-xs font-bold text-secondary mb-3">
                  {t("delivery_zones.mode_air_delay")}
                </p>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-4">
                  {t("delivery_zones.mode_air_desc")}
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/60">
                <span className="text-xs text-on-surface-variant block">Adapté aux :</span>
                <span className="text-xs font-semibold text-primary">
                  Smartphones, mode, pièces urgentes, colis précieux
                </span>
              </div>
            </div>

            {/* Mode 2: Routier */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col justify-between hover:border-secondary transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4 shadow">
                  <span className="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-primary mb-1">
                  {t("delivery_zones.mode_road_title")}
                </h3>
                <p className="text-xs font-bold text-secondary mb-3">
                  {t("delivery_zones.mode_road_delay")}
                </p>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-4">
                  {t("delivery_zones.mode_road_desc")}
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/60">
                <span className="text-xs text-on-surface-variant block">Adapté aux :</span>
                <span className="text-xs font-semibold text-primary">
                  Électroménager, kits solaires, quincaillerie, textile
                </span>
              </div>
            </div>

            {/* Mode 3: Fluvial / Maritime */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col justify-between hover:border-secondary transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4 shadow">
                  <span className="material-symbols-outlined text-2xl">directions_boat</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-primary mb-1">
                  {t("delivery_zones.mode_river_title")}
                </h3>
                <p className="text-xs font-bold text-secondary mb-3">
                  {t("delivery_zones.mode_river_delay")}
                </p>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-4">
                  {t("delivery_zones.mode_river_desc")}
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/60">
                <span className="text-xs text-on-surface-variant block">Adapté aux :</span>
                <span className="text-xs font-semibold text-primary">
                  Charges lourdes, vrac, denrées agricoles, matériaux
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGISTICS FAQ */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Sécurité &amp; Transparence
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1 tracking-tight">
            {t("delivery_zones.faq_title")}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant mt-2 leading-relaxed">
            {t("delivery_zones.faq_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FAQ 1 */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-lg">verified_user</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-primary">
                {t("delivery_zones.faq_q1")}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-11">
              {t("delivery_zones.faq_a1")}
            </p>
          </div>

          {/* FAQ 2 */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-lg">pin_drop</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-primary">
                {t("delivery_zones.faq_q2")}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-11">
              {t("delivery_zones.faq_a2")}
            </p>
          </div>

          {/* FAQ 3 */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-lg">storefront</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-primary">
                {t("delivery_zones.faq_q3")}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-11">
              {t("delivery_zones.faq_a3")}
            </p>
          </div>

          {/* FAQ 4 */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-lg">shield</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-primary">
                {t("delivery_zones.faq_q4")}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-11">
              {t("delivery_zones.faq_a4")}
            </p>
          </div>
        </div>
      </section>

      {/* WHATSAPP / HELP CALLOUT BANNER */}
      <section className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-14">
        <div className="bg-gradient-to-r from-primary-container via-[#132347] to-primary-container rounded-2xl p-6 sm:p-8 lg:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-outline-variant/30">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary-fixed text-3xl">support_agent</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {t("delivery_zones.help_banner_title")}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl leading-relaxed">
                {t("delivery_zones.help_banner_desc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://wa.me/243810000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-[#050100] font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              <span>{t("delivery_zones.help_banner_btn")}</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
