"use client";

import React from "react";
import Link from "next/link";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";
import { CountryRegion } from "@/data/countries";

export const Footer: React.FC = () => {
  const { country, isRDC } = useMarket();
  const { t } = useT();

  return (
    <footer className="w-full bg-primary text-white border-t border-outline-variant mt-16">
      <div className="w-full px-4 md:px-8 lg:px-10 py-12 max-w-7xl mx-auto space-y-12">
        {/* 5 Columns Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: About & Payment Badges */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-tertiary flex items-center justify-center text-white font-bold">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  light_mode
                </span>
              </div>
              <span className="text-xl font-black text-white font-display">Mwinda Market</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t("footer.about_text")}
            </p>
            <div className="pt-2">
              <span className="text-[11px] text-slate-300 block mb-2 font-bold uppercase tracking-wider">
                {t("footer.local_payments")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {isRDC ? (
                  <>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      M-Pesa
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      Airtel Money
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      Orange Money
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      Visa / MC
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      Mobile Money
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      {country.currency.code}
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      Visa / MC
                    </span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[11px] font-bold text-white border border-white/20">
                      Séquestre Panafricain
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Useful Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {t("footer.useful_links")}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/suivi" className="hover:text-secondary-accent transition-colors">
                  {t("footer.order_tracking")}
                </Link>
              </li>
              <li>
                <Link
                  href="/devenir-vendeur"
                  className="hover:text-secondary-accent transition-colors"
                >
                  {t("footer.become_seller")}
                </Link>
              </li>
              <li>
                <Link href="/conditions" className="hover:text-secondary-accent transition-colors">
                  {t("footer.terms_of_service")}
                </Link>
              </li>
              <li>
                <Link href="/assistance" className="hover:text-secondary-accent transition-colors">
                  {t("footer.faq_help")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: The 26 Provinces or Country Regions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {isRDC ? "Zones desservies" : `Zones : ${country.name.fr}`}
            </h4>
            {isRDC ? (
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-300">
                <li><span>Kinshasa</span></li>
                <li><span>Haut-Katanga</span></li>
                <li><span>Nord-Kivu</span></li>
                <li><span>Sud-Kivu</span></li>
                <li><span>Kongo Central</span></li>
                <li><span>Tshopo</span></li>
                <li><span>Lualaba</span></li>
                <li><span>Kasaï Central</span></li>
                <li><span>Kasaï Oriental</span></li>
                <li><span>Ituri</span></li>
                <li><span>Maniema</span></li>
                <li><span className="font-bold text-secondary-accent">Livraison disponible</span></li>
              </ul>
            ) : (
              <ul className="space-y-2 text-xs text-slate-300">
                {((country.regions as CountryRegion[]) || []).map((r) => (
                  <li key={r.id || r.name}>
                    <span className="font-semibold text-white">{r.name}</span>
                    <span className="block text-[11px] text-slate-400">
                      {r.hub || "Hub Régional"} • {r.delay || "24h - 48h"}
                    </span>
                  </li>
                ))}
                <li>
                  <span className="text-[11px] text-secondary-accent font-bold">
                    Zone Panafricaine Ouverte
                  </span>
                </li>
              </ul>
            )}
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {t("footer.customer_support")}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary-accent text-base mt-0.5">
                  location_on
                </span>
                <span>
                  {isRDC
                    ? "Siège social : Boulevard du 30 Juin, Gombe, Kinshasa - RDC"
                    : `Représentation Régionale : ${country.name.fr} (${country.code})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-accent text-base">chat</span>
                <span>
                  WhatsApp : {isRDC ? "+243 81 000 9999" : `${country.phoneCode} 800 000`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-accent text-base">call</span>
                <span>
                  Hotline Marché : {isRDC ? "+243 99 888 7777" : `${country.phoneCode} 800 001`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-accent text-base">mail</span>
                <span>support@mwindamarket.cd</span>
              </div>
            </div>
          </div>

          {/* Column 5: Social Channels & PWA App */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Communauté</h4>
            <p className="text-xs text-slate-300">
              Suivez l&apos;évolution des marchés africains sur nos réseaux officiels :
            </p>
            <div className="flex items-center gap-2">
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-secondary transition"
              >
                FB
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-secondary transition"
              >
                IG
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-secondary transition"
              >
                LN
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-secondary transition"
              >
                X
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-secondary transition"
              >
                TK
              </a>
            </div>

            <div className="pt-3">
              <span className="text-[11px] text-slate-300 block mb-1.5 font-semibold">
                Télécharger l&apos;Application PWA
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Mwinda Market est installable directement via le menu 'Ajouter à l'écran d'accueil' de votre navigateur."
                    )
                  }
                  className="px-2.5 py-1.5 rounded bg-white/10 text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 transition"
                >
                  <span className="material-symbols-outlined text-sm">android</span>
                  <span>Google Play</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Mwinda Market est installable sur iOS en appuyant sur 'Partager' puis 'Sur l'écran d'accueil'."
                    )
                  }
                  className="px-2.5 py-1.5 rounded bg-white/10 text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 transition"
                >
                  <span className="material-symbols-outlined text-sm">phone_iphone</span>
                  <span>App Store</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            © 2025 Mwinda Market. {t("footer.copyright")}
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/confidentialite" className="hover:text-white transition">
              Politique de Confidentialité
            </Link>
            <Link href="/conditions" className="hover:text-white transition">
              Conditions de Vente
            </Link>
            <Link href="/mentions-legales" className="hover:text-white transition">
              Mentions Légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
