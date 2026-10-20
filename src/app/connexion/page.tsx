"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useT } from "@/i18n";

export default function ConnexionPage() {
  const { t } = useT();
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (phone.trim()) setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <nav className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("login.breadcrumb_home")}</span>
              </Link>
            </li>
            <li><span className="material-symbols-outlined text-xs">chevron_right</span></li>
            <li className="text-primary font-semibold">{t("login.breadcrumb_current")}</li>
          </ol>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-12 sm:py-20">
        <div className="w-full max-w-lg space-y-8">
          {/* État principal */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 sm:p-10 shadow-card text-center space-y-6">
            {/* Logo officiel Mwinda Market */}
            <div className="flex justify-center pb-2">
              <Image
                src="/images/logo-mwinda-h-light.png"
                alt="Mwinda Market"
                width={195}
                height={44}
                className="h-[44px] w-auto object-contain"
                priority
              />
            </div>

            {/* Icône animée */}
            <div className="w-16 h-16 bg-secondary-fixed text-on-secondary-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">person_add</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-primary font-display">
                {t("login.coming_title")}
              </h1>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                {t("login.coming_desc")}
              </p>
            </div>

            {/* Alternatives sans compte */}
            <div className="bg-surface-container rounded-xl p-4 text-left space-y-3">
              <p className="text-xs font-bold text-outline uppercase tracking-wide">{t("login.alt_title")}</p>
              <div className="flex items-center gap-3">
                <Link
                  href="/suivi"
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-primary hover:border-secondary hover:bg-surface-container-low transition"
                >
                  <span className="material-symbols-outlined text-base text-secondary">package_2</span>
                  <span>{t("login.alt_track")}</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/devenir-vendeur"
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-primary hover:border-secondary hover:bg-surface-container-low transition"
                >
                  <span className="material-symbols-outlined text-base text-secondary">storefront</span>
                  <span>{t("login.alt_vendor")}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Formulaire de notification */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-card">
            <p className="text-sm font-bold text-primary mb-4 text-center">{t("login.notify_label")}</p>
            {submitted ? (
              <div className="flex items-center justify-center gap-2 text-sm text-secondary font-semibold py-2">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Merci ! Vous serez notifié à l&apos;ouverture.</span>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex gap-2">
                <input
                  id="notify-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("login.notify_placeholder")}
                  className="flex-1 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition placeholder:text-outline"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-secondary/90 transition whitespace-nowrap"
                >
                  {t("login.notify_btn")}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
