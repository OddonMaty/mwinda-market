"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { useT } from "@/i18n";

function TrackingSearchContent() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // If order param was passed in URL (e.g. /suivi?order=MW-1250)
  useEffect(() => {
    const queryOrder = searchParams.get("order") || searchParams.get("ref");
    if (queryOrder) {
      setOrderCode(queryOrder.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCode = orderCode.trim().toUpperCase();

    if (!cleanedCode) {
      setError(t("tracking.error_empty_code"));
      return;
    }

    // Support MW- prefix or loose code
    const validPattern = /^MW-[A-Z0-9]+$/i;
    let finalCode = cleanedCode;
    if (!cleanedCode.startsWith("MW-")) {
      finalCode = `MW-${cleanedCode}`;
    }

    if (!validPattern.test(finalCode)) {
      setError(t("tracking.error_invalid_format"));
      return;
    }

    setError(null);
    setIsSearching(true);

    setTimeout(() => {
      router.push(`/suivi/${encodeURIComponent(finalCode)}`);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      <Header />

      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("tracking.breadcrumb_home")}</span>
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface font-semibold">{t("tracking.breadcrumb_tracking")}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-8 lg:py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-container text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_shipping
              </span>
              <span>{t("tracking.pill_badge")}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-primary font-display tracking-tight">
              {t("tracking.hero_title")}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              {t("tracking.hero_subtitle")}
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-10 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Code de commande input */}
                <div>
                  <label htmlFor="orderCode" className="block text-xs font-bold text-primary mb-1.5">
                    {t("tracking.input_ref_label")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                      tag
                    </span>
                    <input
                      id="orderCode"
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                      placeholder={t("tracking.input_ref_placeholder")}
                      className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs sm:text-sm text-primary font-mono uppercase focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition placeholder:font-sans placeholder:normal-case placeholder:text-outline"
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    {t("tracking.input_ref_hint")}
                  </p>
                </div>

                {/* Numéro Mobile Money optionnel */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-primary mb-1.5">
                    {t("tracking.input_phone_label")} <span className="text-outline font-normal">{t("tracking.optional")}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-bold text-primary font-mono">
                      +243
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="81 000 0000"
                      className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs sm:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition placeholder:text-outline"
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    {t("tracking.input_phone_hint")}
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-4 px-6 rounded-xl bg-tertiary hover:bg-tertiary-hover text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95"
              >
                {isSearching ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                    <span>{t("tracking.btn_searching")}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">track_changes</span>
                    <span>{t("tracking.btn_search")}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Links */}
            <div className="mt-8 pt-6 border-t border-outline-variant">
              <p className="text-xs font-bold text-primary mb-3">
                {t("tracking.demo_title")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Link
                  href="/suivi/MW-1250"
                  className="p-3 rounded-xl border border-outline-variant hover:border-secondary hover:bg-surface-container-low transition text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-primary group-hover:text-secondary">
                      #MW-1250
                    </span>
                    <Badge variant="express" text={t("tracking.demo_in_progress")} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Kinshasa (Gombe) • Livreur en route
                  </p>
                </Link>

                <Link
                  href="/suivi/MW-849201"
                  className="p-3 rounded-xl border border-outline-variant hover:border-secondary hover:bg-surface-container-low transition text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-primary group-hover:text-secondary">
                      #MW-849201
                    </span>
                    <Badge variant="interprovincial" text={t("tracking.demo_transit")} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Haut-Katanga (Lubumbashi) • Hub
                  </p>
                </Link>

                <Link
                  href="/suivi/MW-309112"
                  className="p-3 rounded-xl border border-outline-variant hover:border-secondary hover:bg-surface-container-low transition text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-primary group-hover:text-secondary">
                      #MW-309112
                    </span>
                    <Badge variant="verified" text={t("tracking.demo_delivered")} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Kongo Central (Matadi) • Reçu
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Informational Guidance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  my_location
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary">{t("tracking.guidance_gps_title")}</h3>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {t("tracking.guidance_gps_desc")}
              </p>
            </div>

            <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pin
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary">{t("tracking.guidance_pin_title")}</h3>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {t("tracking.guidance_pin_desc")}
              </p>
            </div>

            <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary">{t("tracking.guidance_escrow_title")}</h3>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {t("tracking.guidance_escrow_desc")}
              </p>
            </div>
          </div>

          {/* Assistance contact block */}
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-xl">headset_mic</span>
              <span>{t("tracking.assistance_callout")}</span>
            </div>
            <a
              href="tel:+243810009999"
              className="font-bold text-secondary hover:text-primary transition font-mono text-sm"
            >
              +243 81 000 9999
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackingSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-sm text-outline">
            <span className="material-symbols-outlined animate-spin text-secondary">refresh</span>
            <span>Chargement du suivi de commande...</span>
          </div>
        </div>
      }
    >
      <TrackingSearchContent />
    </Suspense>
  );
}
