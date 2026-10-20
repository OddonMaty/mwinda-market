"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n";
import { CONTACT_CONFIG } from "@/config/contact";

const PHONE = CONTACT_CONFIG.phoneRaw;
const WHATSAPP_LINK = CONTACT_CONFIG.whatsappLink;

export default function AssistancePage() {
  const { t } = useT();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: t("help.faq_q1"), a: t("help.faq_a1") },
    { q: t("help.faq_q2"), a: t("help.faq_a2") },
    { q: t("help.faq_q3"), a: t("help.faq_a3") },
    { q: t("help.faq_q4"), a: t("help.faq_a4") },
    { q: t("help.faq_q5"), a: t("help.faq_a5") },
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
                <span>{t("help.breadcrumb_home")}</span>
              </Link>
            </li>
            <li><span className="material-symbols-outlined text-xs">chevron_right</span></li>
            <li className="text-primary font-semibold">{t("help.breadcrumb_current")}</li>
          </ol>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-8 py-10 sm:py-14 w-full">
        {/* Hero */}
        <div className="text-center mb-12 space-y-3">
          <div className="w-16 h-16 bg-secondary-fixed text-on-secondary-container rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">support_agent</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary font-display">{t("help.hero_title")}</h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-lg mx-auto">{t("help.hero_desc")}</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link
            href="/suivi"
            className="flex flex-col items-center gap-2 bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 text-center hover:border-secondary hover:shadow-md transition group"
          >
            <span className="material-symbols-outlined text-2xl text-secondary group-hover:scale-110 transition">package_2</span>
            <span className="text-xs sm:text-sm font-semibold text-primary">{t("help.tracking_link")}</span>
          </Link>
          <Link
            href="/devenir-vendeur"
            className="flex flex-col items-center gap-2 bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 text-center hover:border-secondary hover:shadow-md transition group"
          >
            <span className="material-symbols-outlined text-2xl text-secondary group-hover:scale-110 transition">store</span>
            <span className="text-xs sm:text-sm font-semibold text-primary">{t("help.vendor_link")}</span>
          </Link>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-display mb-5">{t("help.faq_title")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
                <button
                  id={`faq-btn-${i}`}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-primary hover:bg-surface-container transition"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined text-lg text-secondary flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                  className={`overflow-hidden transition-all duration-200 ${openFaq === i ? "max-h-40" : "max-h-0"}`}
                >
                  <p className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact bloc */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 sm:p-8 text-white space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display mb-1">{t("help.contact_title")}</h2>
            <p className="text-white/80 text-xs sm:text-sm">{t("help.contact_hours")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${PHONE}`}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-white/90 transition shadow"
            >
              <span className="material-symbols-outlined text-lg">call</span>
              <span>{t("help.contact_phone")}</span>
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white/20 border border-white/40 text-white rounded-xl font-bold text-sm hover:bg-white/30 transition"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              <span>{t("help.contact_whatsapp")}</span>
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80 pt-1">
            <span className="material-symbols-outlined text-base">mail</span>
            <a href={`mailto:${CONTACT_CONFIG.email}`} className="hover:text-white transition underline underline-offset-2">
              {CONTACT_CONFIG.email}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
