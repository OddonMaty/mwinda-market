"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItemList } from "@/components/cart/CartItemList";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { CheckoutGate } from "@/components/cart/CheckoutGate";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotalUsd, totalCount } = useCart();
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  const handleOrderSuccess = (orderNumber: string) => {
    setOrderConfirmed(orderNumber);
    clearCart();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      <Header />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>Accueil</span>
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface font-semibold">Panier ({totalCount})</span>
            </li>
          </ol>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Modale / Écran de succès si commande confirmée */}
        {orderConfirmed ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-secondary/30 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-card space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Commande Enregistrée
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-primary font-display">
                Merci pour votre confiance !
              </h1>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                Votre commande <strong className="text-primary font-bold">#{orderConfirmed}</strong> a été enregistrée avec succès sous garantie Escrow.
              </p>
            </div>

            <div className="p-4 bg-surface-container rounded-xl text-xs text-left space-y-2 border border-outline-variant">
              <div className="flex items-center gap-2 font-bold text-primary">
                <span className="material-symbols-outlined text-secondary text-base">security</span>
                <span>Protection Acheteur Mwinda</span>
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                Le montant reste bloqué sur notre compte tiers de confiance. Le vendeur prépare votre colis et la livraison démarre immédiatement.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href={`/suivi?order=${orderConfirmed}`}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  <span className="material-symbols-outlined mr-1.5 text-base">track_changes</span>
                  Suivre ma commande
                </Button>
              </Link>
              <Link href="/produits">
                <Button variant="outline" className="w-full sm:w-auto">
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State pour le panier */
          <EmptyState
            icon="shopping_basket"
            title="Votre panier est actuellement vide"
            description="Découvrez des milliers de produits authentiques proposés par nos marchands et vendeurs certifiés."
            actionLabel="Explorer le catalogue"
            actionHref="/produits"
          />
        ) : (
          /* Contenu principal du panier (2 colonnes) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Colonne gauche : Liste des articles */}
            <div className="lg:col-span-7 space-y-6">
              <CartItemList
                items={items}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
              />
            </div>

            {/* Colonne droite : Résumé & Checkout Gate (Réservé aux inscrits) */}
            <div className="lg:col-span-5 space-y-6">
              <CartOrderSummary
                subtotalUsd={subtotalUsd}
                totalCount={totalCount}
              />
              <CheckoutGate
                subtotalUsd={subtotalUsd}
                itemCount={totalCount}
                onOrderSuccess={handleOrderSuccess}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
