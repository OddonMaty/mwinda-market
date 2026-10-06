"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n";

export default function ConditionsPage() {
  const { t } = useT();

  const cgvSections = [
    { icon: "shopping_bag",   titleKey: "terms.order_title",    bodyKey: "terms.order_desc" },
    { icon: "lock",           titleKey: "terms.payment_title",  bodyKey: "terms.payment_desc" },
    { icon: "local_shipping", titleKey: "terms.delivery_title", bodyKey: "terms.delivery_desc" },
    { icon: "undo",           titleKey: "terms.returns_title",  bodyKey: "terms.returns_desc" },
    { icon: "store",          titleKey: "terms.seller_title",   bodyKey: "terms.seller_desc" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <nav className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("terms.breadcrumb_home")}</span>
              </Link>
            </li>
            <li><span className="material-symbols-outlined text-xs">chevron_right</span></li>
            <li className="text-primary font-semibold">{t("terms.breadcrumb_current")}</li>
          </ol>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-8 py-10 sm:py-14 w-full">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-sm">contract</span>
            <span>CGV</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary font-display mb-2">{t("terms.title")}</h1>
          <p className="text-sm text-on-surface-variant">{t("terms.last_updated")} : 6 octobre 2026</p>
        </div>
        <div className="space-y-6">
          <div className="bg-surface-container rounded-xl border border-outline-variant px-6 py-4 text-sm text-on-surface-variant italic">
            {t("terms.intro_desc")}
          </div>
          {cgvSections.map((s, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-primary font-display">{t(s.titleKey)}</h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t(s.bodyKey)}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
