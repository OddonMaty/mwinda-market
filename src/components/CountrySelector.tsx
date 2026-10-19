"use client";

import React, { useState, useEffect } from "react";
import { useMarket } from "@/context/MarketContext";
import { getActiveCountries } from "@/lib/activeCountries";
import { Country } from "@/data/countries";
import { useT } from "@/i18n";

interface CountrySelectorProps {
  variant?: "header" | "compact" | "card";
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  variant = "header",
  className = "",
}) => {
  const { country, setCountry, language } = useMarket();
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeCountries = getActiveCountries();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (selected: Country) => {
    setCountry(selected.code);
    setIsOpen(false);
  };

  const filteredCountries = activeCountries.filter((c) => {
    const q = searchQuery.toLowerCase();
    const frName = c.name.fr.toLowerCase();
    const enName = c.name.en.toLowerCase();
    const code = c.code.toLowerCase();
    const currency = c.currency.code.toLowerCase();
    return (
      frName.includes(q) ||
      enName.includes(q) ||
      code.includes(q) ||
      currency.includes(q)
    );
  });

  const countryDisplayName = language === "en" ? country.name.en : country.name.fr;

  return (
    <>
      {/* ─── VARIANT HEADER (Desktop) ─────────────────────────────────── */}
      {variant === "header" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition text-xs font-medium leading-none group ${className}`}
          title={t("country_selector.change_title")}
        >
          <span className="text-sm select-none">{country.flag}</span>
          <span className="truncate max-w-[130px]">{countryDisplayName}</span>
          <span className="text-white/60">·</span>
          <span className="font-semibold text-secondary-accent">{country.currency.code}</span>
          <span className="material-symbols-outlined text-xs text-white/70 group-hover:translate-y-0.5 transition-transform">
            expand_more
          </span>
        </button>
      )}

      {/* ─── VARIANT COMPACT (Mobile bar) ─────────────────────────────── */}
      {variant === "compact" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-outline-variant bg-surface text-xs font-semibold text-primary active:scale-95 transition ${className}`}
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span>{country.code}</span>
          <span className="text-[10px] text-secondary font-bold">({country.currency.code})</span>
          <span className="material-symbols-outlined text-xs text-outline">expand_more</span>
        </button>
      )}

      {/* ─── VARIANT CARD (Drawer mobile) ─────────────────────────────── */}
      {variant === "card" && (
        <div
          onClick={() => setIsOpen(true)}
          className={`p-3 rounded-xl border border-secondary-fixed bg-surface-container-low cursor-pointer hover:bg-surface-container transition ${className}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              {t("country_selector.card_title")}
            </span>
            <span className="text-xs font-bold text-secondary flex items-center gap-0.5">
              {t("country_selector.edit")}
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-2xl">{country.flag}</span>
            <div>
              <div className="font-bold text-sm text-primary">{countryDisplayName}</div>
              <p className="text-[11px] text-on-surface-variant">
                {t("country_selector.currency_label")} <strong>{country.currency.name} ({country.currency.code})</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALE DE SÉLECTION DU PAYS ──────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-primary/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden z-10 animate-scale-up max-h-[88vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-base shadow-sm">
                  🌍
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary font-display">
                    {t("country_selector.modal_title")}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {activeCountries.length} {t("country_selector.countries_available")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Notice d'ouverture progressive */}
            <div className="px-5 py-2.5 bg-secondary-fixed/50 border-b border-secondary-fixed flex items-center gap-2 text-xs text-on-secondary-fixed">
              <span className="material-symbols-outlined text-secondary text-base">info</span>
              <span>
                {t("country_selector.modal_notice")}
              </span>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder={t("country_selector.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  autoFocus
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-xs">
                  {t("country_selector.no_results")}
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === country.code;
                  const isFlagship = c.code === "CD";
                  const cName = language === "en" ? c.name.en : c.name.fr;

                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                        isSelected
                          ? "border-secondary bg-secondary-fixed/40 ring-1 ring-secondary"
                          : "border-outline-variant bg-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl leading-none">{c.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-primary">{cName}</span>
                            {isFlagship && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container text-white">
                                {t("country_selector.flagship_badge")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Devise :{" "}
                            <span className="font-semibold text-secondary">
                              {c.currency.code} ({c.currency.symbol})
                            </span>{" "}
                            • Indicatif {c.phoneCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="material-symbols-outlined text-secondary text-xl">
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-outline text-lg">
                            chevron_right
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-surface-container-low border-t border-outline-variant text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>
                {t("country_selector.current_zone")} <strong>{countryDisplayName}</strong>
              </span>
              <span className="text-secondary font-medium">{t("country_selector.panafrican_catalog")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
