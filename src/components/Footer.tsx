"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";
import { getActiveCountries } from "@/lib/activeCountries";
import { CONTACT_CONFIG } from "@/config/contact";
import {
  Lock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Headphones,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REASSURANCE = [
  { icon: Lock, labelKey: "reassurance_secure_pay" as const },
  { icon: ShieldCheck, labelKey: "reassurance_escrow" as const },
  { icon: Truck, labelKey: "reassurance_delivery" as const },
  { icon: CheckCircle2, labelKey: "reassurance_certified" as const },
  { icon: Headphones, labelKey: "reassurance_support" as const },
  { icon: Smartphone, labelKey: "reassurance_pwa" as const },
];

const PAYMENT_BADGES = ["M-Pesa", "Airtel Money", "Orange Money", "Visa", "Mastercard"];

export const Footer: React.FC = () => {
  const { country, language, setCountry } = useMarket();
  const { t } = useT();

  const activeCountries = getActiveCountries();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-border/70 mt-16">
      {/* ─── BANDEAU DE RASSURANCE ÉPURÉ ─────────────────────────── */}
      <div className="w-full bg-slate-50/70 border-b border-border/60">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {REASSURANCE.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.labelKey} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-border/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon className="w-4 h-4 text-brand-blue" />
                </div>
                <span className="text-xs font-medium text-foreground leading-snug">
                  {t(`footer.${item.labelKey}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── COLONNES PRINCIPALES ─────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Colonne 1 — À propos & Moyens de paiement */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <Link href="/" className="inline-block" aria-label="Mwinda Market">
              <Image
                src="/images/logo-mwinda-h-light.png"
                alt="Mwinda Market"
                width={175}
                height={38}
                className="h-[38px] w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("footer.about_text")}
            </p>

            {/* Badges de paiement sécurisé */}
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("footer.payments_label")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="px-2.5 py-1 bg-slate-100/80 border border-border/60 rounded-md text-[11px] font-semibold text-slate-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne 2 — Acheter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("footer.col_buy")}
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { href: "/assistance", label: t("footer.col_buy_how") },
                { href: "/suivi", label: t("footer.col_buy_tracking") },
                { href: "/boutiques", label: t("footer.col_buy_shops") },
                { href: "/produits", label: t("footer.col_buy_catalog") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Vendre */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("footer.col_sell")}
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { href: "/devenir-vendeur", label: t("footer.col_sell_become") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 — Aide & Légal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("footer.col_help")}
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { href: "/assistance", label: t("footer.col_help_assistance") },
                { href: "/conditions", label: t("footer.col_help_terms") },
                { href: "/confidentialite", label: t("footer.col_help_privacy") },
                { href: "/mentions-legales", label: t("footer.col_help_legal") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 5 — Pays desservis */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("footer.col_countries")}
            </h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-3 gap-y-1 text-xs">
              {activeCountries.map((c) => {
                const countryName = language === "en" ? c.name.en : c.name.fr;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => setCountry(c.code)}
                      className={cn(
                        "flex items-center gap-1.5 w-full text-left py-1 rounded transition-colors text-xs",
                        c.code === country.code
                          ? "text-brand-blue font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={countryName}
                    >
                      <span className="shrink-0">{c.flag}</span>
                      <span className="truncate">{countryName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* ─── BARRE INFÉRIEURE MARINE ───────────────────────────────── */}
      <div className="w-full bg-brand-navy text-white text-xs">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          {/* Logo & copyright */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-mwinda-h-dark.png"
              alt="Mwinda Market"
              width={130}
              height={28}
              className="h-[28px] w-auto object-contain"
            />
            <span className="text-white/40">·</span>
            <span className="text-white/80">© {year} — {t("footer.copyright")}</span>
          </div>

          {/* Centre: Pays actif */}
          <div className="flex items-center gap-2 text-white/80">
            <span>{country.flag}</span>
            <span>{country.name.fr}</span>
            <span className="text-white/40">·</span>
            <Link href="/assistance" className="hover:text-white transition-colors">
              {t("footer.col_help_assistance")}
            </Link>
          </div>

          {/* Droite: liens légaux & WhatsApp */}
          <div className="flex items-center gap-4 text-white/80">
            <Link href="/confidentialite" className="hover:text-white transition-colors">
              {t("footer.col_help_privacy")}
            </Link>
            <Link href="/conditions" className="hover:text-white transition-colors">
              {t("footer.col_help_terms")}
            </Link>
            <a
              href={CONTACT_CONFIG.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
