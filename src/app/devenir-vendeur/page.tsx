"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PricingPlanGrid } from "@/components/vendor/PricingPlanGrid";
import { VendorRegistrationForm } from "@/components/vendor/VendorRegistrationForm";

export default function DevenirVendeurPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<"free" | "pro" | "elite" | "wholesale">("free");

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Header />

      <main className="flex-grow space-y-12 pb-16">
        {/* ─── HERO BANNER ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-10 pb-14 md:pt-14 md:pb-18 bg-gradient-to-b from-surface-container-low/60 to-background border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest/60 border border-secondary/20 text-on-secondary-fixed text-[11px] font-bold tracking-widest uppercase shadow-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Réseau de Vendeurs Certifiés Mwinda
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary font-display tracking-tight leading-tight">
                Vendez vos produits en Afrique et développez votre commerce
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                Rejoignez la première place de marché panafricaine connectée. Paiements Mobile Money garantis par Escrow, logistique simplifiée et visibilité auprès de milliers de clients.
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs font-semibold text-primary">
                <div className="flex items-center gap-1.5 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-secondary text-base">verified</span>
                  <span>Offre Essentiel 100% Gratuite (5% com.)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-secondary text-base">payments</span>
                  <span>Versements M-Pesa / Airtel / Orange</span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-secondary text-base">security</span>
                  <span>Garantie Anti-Fraude Escrow</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 1 : GRILLE DES 4 OFFRES BOUTIQUES ───────────────── */}
        <section className="max-w-7xl mx-auto px-4 md:px-8">
          <PricingPlanGrid
            selectedPlanId={selectedPlanId}
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              // scroll to form
              const el = document.getElementById("inscription-vendeur");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </section>

        {/* ─── SECTION 2 : FORMULAIRE D'OUVERTURE DE BOUTIQUE ──────────── */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
          <VendorRegistrationForm selectedPlanId={selectedPlanId} />
        </section>

        {/* ─── SECTION 3 : COMMENT ÇA FONCTIONNE ───────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 shadow-card space-y-6">
            <h3 className="text-xl font-black text-primary font-display text-center">
              Comment ouvrir votre boutique en 3 étapes simples
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-surface-container-low">
                <div className="w-10 h-10 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow">
                  1
                </div>
                <h4 className="font-bold text-sm text-primary">Inscrivez-vous</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Créez votre compte membre et choisissez l&apos;offre qui vous correspond.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-surface-container-low">
                <div className="w-10 h-10 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow">
                  2
                </div>
                <h4 className="font-bold text-sm text-primary">Ajoutez vos articles</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Renseignez vos prix, photos et stocks depuis votre tableau de bord vendeur.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-surface-container-low">
                <div className="w-10 h-10 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow">
                  3
                </div>
                <h4 className="font-bold text-sm text-primary">Vendez & Encaissez</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Expédiez vos commandes et recevez vos fonds par Mobile Money après livraison.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
