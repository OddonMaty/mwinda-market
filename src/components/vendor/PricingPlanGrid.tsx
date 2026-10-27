"use client";

import React from "react";
import { VENDOR_PLANS } from "@/data/vendorPlans";
import { Button } from "@/components/ui/button";

interface PricingPlanGridProps {
  selectedPlanId: string;
  onSelectPlan: (planId: "free" | "pro" | "elite" | "wholesale") => void;
}

export function PricingPlanGrid({
  selectedPlanId,
  onSelectPlan,
}: PricingPlanGridProps) {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-primary font-display">
          Choisissez l&apos;offre adaptée à votre commerce
        </h2>
        <p className="text-sm text-on-surface-variant">
          Des forfaits transparents, abordables et pensés pour le marché africain. Démarrez sans frais ou boostez vos ventes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {VENDOR_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`cursor-pointer relative rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between border ${
                isSelected
                  ? "border-secondary bg-surface-container-lowest ring-2 ring-secondary shadow-lg scale-[1.02]"
                  : "border-outline-variant bg-surface-container-lowest/80 hover:border-secondary/50 hover:bg-surface-container-lowest shadow-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  Recommandé
                </div>
              )}

              <div className="space-y-4">
                {/* En-tête */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-primary">{plan.name}</h3>
                    {plan.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 min-h-[32px] leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                {/* Prix & Commission */}
                <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/60 space-y-1 text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black text-primary font-display">
                      {plan.priceUsd === 0 ? "0 $" : `${plan.priceUsd} $`}
                    </span>
                    <span className="text-xs text-outline font-semibold">/ mois</span>
                  </div>
                  {plan.priceCdfApprox > 0 && (
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      ~ {plan.priceCdfApprox.toLocaleString("fr-FR")} FC / mois
                    </p>
                  )}
                  <div className="pt-1.5 border-t border-outline-variant/40 mt-1">
                    <span className="text-xs font-bold text-secondary">
                      {plan.commissionRate}% de commission par vente
                    </span>
                  </div>
                </div>

                {/* Caractéristiques */}
                <ul className="space-y-2.5 text-xs text-on-surface-variant pt-2">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton de sélection */}
              <div className="pt-6">
                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "outline"}
                  className="w-full text-xs font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(plan.id);
                  }}
                >
                  {isSelected ? "Offre Sélectionnée" : "Sélectionner cette offre"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
