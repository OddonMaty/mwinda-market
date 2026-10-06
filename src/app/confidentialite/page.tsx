"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n";

export default function ConfidentialitePage() {
  const { t } = useT();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <nav className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("privacy.breadcrumb_home")}</span>
              </Link>
            </li>
            <li><span className="material-symbols-outlined text-xs">chevron_right</span></li>
            <li className="text-primary font-semibold">{t("privacy.breadcrumb_current")}</li>
          </ol>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-8 py-10 sm:py-14 w-full">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary font-display mb-2">{t("privacy.title")}</h1>
          <p className="text-sm text-on-surface-variant">{t("privacy.last_updated")} : 6 octobre 2026</p>
        </div>

        <div className="space-y-6">
          {/* Intro */}
          <div className="bg-gradient-to-br from-secondary-fixed/60 to-surface-container rounded-2xl border border-outline-variant p-6 sm:p-8">
            <h2 className="text-lg font-bold text-primary font-display mb-2">{t("privacy.intro_title")}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{t("privacy.intro_desc")}</p>
          </div>

          {/* Données collectées */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">database</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-primary font-display">{t("privacy.collect_title")}</h2>
            </div>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              {[
                t("privacy.collect_account"),
                t("privacy.collect_orders"),
                t("privacy.collect_navigation"),
                t("privacy.collect_payment"),
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary mt-0.5">info</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Utilisation */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">manage_accounts</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-primary font-display">{t("privacy.use_title")}</h2>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{t("privacy.use_desc")}</p>
          </div>

          {/* Droits */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">verified_user</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-primary font-display">{t("privacy.rights_title")}</h2>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{t("privacy.rights_desc")}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-secondary text-base">mail</span>
              <a href={`mailto:${t("privacy.contact_email")}`} className="text-secondary font-semibold hover:underline">
                {t("privacy.contact_email")}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
