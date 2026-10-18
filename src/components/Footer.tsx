"use client";

import React from "react";
import Link from "next/link";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";
import { AFRICAN_COUNTRIES } from "@/data/countries";

const REASSURANCE = [
  { icon: "lock", labelKey: "reassurance_secure_pay" as const },
  { icon: "account_balance_wallet", labelKey: "reassurance_escrow" as const },
  { icon: "local_shipping", labelKey: "reassurance_delivery" as const },
  { icon: "verified", labelKey: "reassurance_certified" as const },
  { icon: "support_agent", labelKey: "reassurance_support" as const },
  { icon: "install_mobile", labelKey: "reassurance_pwa" as const },
];

const PAYMENT_BADGES = ["M-Pesa", "Airtel Money", "Orange Money", "Visa", "Mastercard"];

export const Footer: React.FC = () => {
  const { country, isRDC, setCountry } = useMarket();
  const { t } = useT();

  const year = new Date().getFullYear();
  const whatsapp = isRDC ? "+243818900125" : country.phoneCode.replace("+", "") + "800000";

  return (
    <footer className="w-full bg-white border-t border-outline-variant mt-16">
      {/* ─── REASSURANCE BAND ─────────────────────────────────────────────── */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {REASSURANCE.map((item) => (
            <div key={item.icon} className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-secondary text-xl shrink-0">{item.icon}</span>
              <span className="text-xs font-semibold text-on-surface leading-tight">
                {t(`footer.${item.labelKey}`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN COLUMNS ─────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

          {/* Col 1 — Logo + about */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow">
                <span
                  className="material-symbols-outlined text-xl text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  light_mode
                </span>
              </div>
              <span className="text-lg font-black text-primary tracking-tight font-display">Mwinda Market</span>
            </Link>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t("footer.about_text")}
            </p>

            {/* Payment badges */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-2">
                {t("footer.payments_label")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-0.5 bg-surface-container border border-outline-variant rounded text-[11px] font-bold text-on-surface"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2 — Acheter */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant pb-1.5">
              {t("footer.col_buy")}
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/assistance", label: t("footer.col_buy_how") },
                { href: "/suivi", label: t("footer.col_buy_tracking") },
                { href: "/boutiques", label: t("footer.col_buy_shops") },
                { href: "/produits", label: t("footer.col_buy_catalog") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-on-surface-variant hover:text-secondary transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Vendre */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant pb-1.5">
              {t("footer.col_sell")}
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/devenir-vendeur", label: t("footer.col_sell_become") },
                { href: "/vendeur/dashboard", label: t("footer.col_sell_dashboard") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-on-surface-variant hover:text-secondary transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Aide */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant pb-1.5">
              {t("footer.col_help")}
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/assistance", label: t("footer.col_help_assistance") },
                { href: "/conditions", label: t("footer.col_help_terms") },
                { href: "/confidentialite", label: t("footer.col_help_privacy") },
                { href: "/mentions-legales", label: t("footer.col_help_legal") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-on-surface-variant hover:text-secondary transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5 — Pays desservis */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant pb-1.5">
              {t("footer.col_countries")}
            </h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1 max-h-52 overflow-y-auto pr-1">
              {AFRICAN_COUNTRIES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => setCountry(c.code)}
                    className={`flex items-center gap-1.5 text-xs w-full text-left py-0.5 rounded transition ${
                      c.code === country.code
                        ? "text-secondary font-bold"
                        : "text-on-surface-variant hover:text-secondary"
                    }`}
                    title={c.name.fr}
                  >
                    <span>{c.flag}</span>
                    <span className="truncate">{c.name.fr}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM BAR ───────────────────────────────────────────────────── */}
      <div className="w-full bg-primary text-white/80">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          {/* Left: logo + copyright */}
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              light_mode
            </span>
            <span className="font-semibold text-white">Mwinda Market</span>
            <span className="text-white/50">·</span>
            <span>© {year} — {t("footer.copyright")}</span>
          </div>
          {/* Center: country + language */}
          <div className="flex items-center gap-3 text-white/70">
            <span>{country.flag} {country.name.fr}</span>
            <span>·</span>
            <Link href="/assistance" className="hover:text-white transition">
              {t("footer.col_help_assistance")}
            </Link>
          </div>
          {/* Right: legal links */}
          <div className="flex items-center gap-4">
            <Link href="/confidentialite" className="hover:text-white transition">{t("footer.col_help_privacy")}</Link>
            <Link href="/conditions" className="hover:text-white transition">{t("footer.col_help_terms")}</Link>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
