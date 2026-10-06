"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n";

export default function MentionsLegalesPage() {
  const { t } = useT();

  const sections = [
    {
      icon: "business",
      title: t("legal.editor_title"),
      items: [t("legal.editor_name"), t("legal.editor_address"), t("legal.editor_email")],
    },
    {
      icon: "dns",
      title: t("legal.host_title"),
      items: [t("legal.host_name"), t("legal.host_address")],
    },
    {
      icon: "copyright",
      title: t("legal.ip_title"),
      body: t("legal.ip_desc"),
    },
    {
      icon: "shield",
      title: t("legal.liability_title"),
      body: t("legal.liability_desc"),
    },
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
                <span>{t("legal.breadcrumb_home")}</span>
              </Link>
            </li>
            <li><span className="material-symbols-outlined text-xs">chevron_right</span></li>
            <li className="text-primary font-semibold">{t("legal.breadcrumb_current")}</li>
          </ol>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-8 py-10 sm:py-14 w-full">
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-sm">gavel</span>
            <span>Légal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary font-display">{t("legal.title")}</h1>
          <p className="text-sm text-on-surface-variant">{t("legal.last_updated")} : 6 octobre 2026</p>
        </div>
        <div className="space-y-6">
          {sections.map((s, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-primary font-display">{s.title}</h2>
              </div>
              {s.items && (
                <ul className="space-y-1.5 text-sm text-on-surface-variant">
                  {s.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm text-secondary mt-0.5">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.body && <p className="text-sm text-on-surface-variant leading-relaxed">{s.body}</p>}
            </div>
          ))}
          <p className="text-xs text-outline text-center py-4 border-t border-outline-variant">{t("legal.update_notice")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
