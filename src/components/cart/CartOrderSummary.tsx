"use client";

import React from "react";
import { PriceTag } from "@/components/PriceTag";

interface CartOrderSummaryProps {
  subtotalUsd: number;
  totalCount: number;
}

export function CartOrderSummary({ subtotalUsd, totalCount }: CartOrderSummaryProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-card space-y-5">
      <h3 className="text-base font-bold text-primary border-b border-outline-variant pb-3">
        Résumé de la commande
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center text-on-surface-variant">
          <span>Articles ({totalCount})</span>
          <span className="font-semibold text-primary">${subtotalUsd.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-on-surface-variant">
          <span>Livraison</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Calculée au point relais / adresse
          </span>
        </div>

        <div className="border-t border-outline-variant/60 pt-3 flex justify-between items-baseline">
          <span className="text-base font-bold text-primary">Total à payer</span>
          <div className="text-right">
            <PriceTag usdPrice={subtotalUsd} size="lg" />
          </div>
        </div>
      </div>

      {/* Garantie Escrow Mwinda */}
      <div className="p-3.5 bg-secondary-fixed/30 rounded-xl border border-secondary/20 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <span className="material-symbols-outlined text-base text-secondary">verified_user</span>
          <span>Paiement 100% Sécurisé & Protégé</span>
        </div>
        <p className="text-on-surface-variant text-[11px] leading-relaxed">
          Votre argent est sécurisé par Mwinda Escrow. Le vendeur n&apos;est payé que lorsque vous confirmez la bonne réception de votre colis.
        </p>
      </div>
    </div>
  );
}
