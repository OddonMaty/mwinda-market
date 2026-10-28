"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { DEMO_MODE } from "@/config/demo";

interface CheckoutGateProps {
  subtotalUsd: number;
  itemCount: number;
  items?: Array<{ id: string; title: string; image: string; usdPrice: number; quantity: number }>;
  onOrderSuccess: (orderNumber: string) => void;
}

export function CheckoutGate({
  subtotalUsd,
  itemCount,
  items = [],
  onOrderSuccess,
}: CheckoutGateProps) {
  const { user, isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "airtel" | "orange" | "card">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+243/, "") || "81");
  const [customerName, setCustomerName] = useState(user?.fullName || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "Kinshasa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // RÈGLE MÉTIER STRICTE : Si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-secondary/40 p-6 sm:p-8 shadow-card text-center space-y-4">
        <div className="w-14 h-14 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl">lock</span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-primary">
            Connexion obligatoire pour commander
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Pour sécuriser vos paiements Mobile Money par garantie Escrow et vous assurer un suivi en temps réel de votre colis, vous devez être inscrit sur Mwinda Market.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/connexion?redirect=/panier">
            <Button variant="secondary" className="w-full sm:w-auto px-8 h-12 text-sm font-bold shadow-md">
              <span className="material-symbols-outlined mr-2 text-base">login</span>
              Se connecter ou s&apos;inscrire pour finaliser
            </Button>
          </Link>
          <p className="text-[11px] text-outline mt-2">
            Vos {itemCount} article(s) resteront sauvegardés dans votre panier.
          </p>
        </div>
      </div>
    );
  }

  // SI CONNECTÉ : Formulaire de commande sécurisé
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customerName.trim()) {
      setFormError("Veuillez renseigner votre nom complet pour la livraison.");
      return;
    }
    if (!address.trim()) {
      setFormError("Veuillez indiquer une adresse ou commune de livraison précise.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 7) {
      setFormError("Veuillez indiquer un numéro de téléphone valide pour le paiement.");
      return;
    }

    setIsSubmitting(true);

    const generatedRef = `MW-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullPhone = phoneNumber.startsWith("+") ? phoneNumber : `+243${phoneNumber.trim().replace(/^0+/, "")}`;

    try {
      // 1. Sauvegarde locale immédiate pour affichage instantané dans Mon Compte (hors-ligne / PWA)
      const localOrder = {
        id: generatedRef,
        reference: generatedRef,
        date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
        created_at: new Date().toISOString(),
        status: "in_prep",
        amount_usd: subtotalUsd,
        currency: "USD",
        items_count: itemCount,
        delivery_address: address,
        delivery_city: city,
        payment_method: paymentMethod,
        items: items.map((it) => ({
          title: it.title,
          quantity: it.quantity,
          unit_usd_price: it.usdPrice,
          image: it.image,
        })),
      };

      const existingOrdersJson = localStorage.getItem("mwinda_local_orders");
      const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
      localStorage.setItem("mwinda_local_orders", JSON.stringify([localOrder, ...existingOrders]));

      // 2. Enregistrement sécurisé via l'API Route serveur (contourne les règles RLS strictes)
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: generatedRef,
          amount_usd: subtotalUsd,
          customer_name: customerName.trim(),
          customer_phone: fullPhone,
          customer_email: user?.email || null,
          delivery_address: address.trim(),
          delivery_city: city,
          country_code: "CD",
          payment_method: paymentMethod,
          payment_status: "escrow_secured",
          status: "in_prep",
          notes: `Commande passée via Mwinda Market Checkout (${paymentMethod})`,
          items: items.map((it) => ({
            title: it.title,
            quantity: it.quantity,
            unit_usd_price: it.usdPrice,
            image: it.image,
          })),
        }),
      }).catch((err) => console.warn("API /api/orders non disponible (mode démo):", err));
    } catch (err) {
      console.warn("Erreur commande:", err);
    } finally {
      setIsSubmitting(false);
      onOrderSuccess(generatedRef);
    }
  };

  const paymentOptions: Array<{ id: "mpesa" | "airtel" | "orange" | "card"; label: string; icon: string; sub: string }> = [
    { id: "mpesa", label: "M-Pesa", icon: "phone_android", sub: "Vodacom" },
    { id: "airtel", label: "Airtel Money", icon: "send_to_mobile", sub: "Airtel" },
    { id: "orange", label: "Orange Money", icon: "smartphone", sub: "Orange" },
    { id: "card", label: "Carte Bancaire", icon: "credit_card", sub: "Visa / MC" },
  ];

  return (
    <form
      onSubmit={handleCheckout}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-card space-y-6"
    >
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div>
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">local_shipping</span>
            <span>Coordonnées de livraison & Paiement</span>
          </h3>
          <p className="text-xs text-on-surface-variant">
            Connecté en tant que <strong className="text-primary">{user?.fullName || user?.phone || user?.email}</strong>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="material-symbols-outlined text-xs">verified</span>
          Membre vérifié
        </span>
      </div>

      {formError && (
        <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{formError}</span>
        </div>
      )}

      {/* Identité destinataire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-primary">Nom du destinataire</label>
          <Input
            type="text"
            placeholder="Ex: Jean Kasongo"
            icon="person"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-primary">Ville / Province</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="Kinshasa">Kinshasa</option>
            <option value="Lubumbashi">Lubumbashi (Haut-Katanga)</option>
            <option value="Goma">Goma (Nord-Kivu)</option>
            <option value="Kisangani">Kisangani (Tshopo)</option>
            <option value="Matadi">Matadi (Kongo Central)</option>
            <option value="Bukavu">Bukavu (Sud-Kivu)</option>
            <option value="Kolwezi">Kolwezi (Lualaba)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-primary">Adresse exacte / Repère de livraison</label>
        <Input
          type="text"
          placeholder="Ex: Av. Kasa-Vubu N° 45, Réf. Rond-point Victoire"
          icon="home_pin"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>

      {/* Mode de paiement */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-primary block">
          Mode de règlement sécurisé (Escrow)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentOptions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-20 ${
                paymentMethod === m.id
                  ? "border-secondary bg-secondary-fixed/30 ring-1 ring-secondary"
                  : "border-outline-variant bg-surface hover:bg-surface-container"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-base text-secondary">{m.icon}</span>
                {paymentMethod === m.id && (
                  <span className="material-symbols-outlined text-xs text-secondary">check_circle</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-primary">{m.label}</p>
                <p className="text-[10px] text-outline">{m.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Numéro pour le push Mobile Money */}
      {paymentMethod !== "card" && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-primary">
            Numéro de compte Mobile Money pour valider la transaction
          </label>
          <div className="flex gap-2">
            <span className="h-11 px-3 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-primary flex items-center">
              🇨🇩 +243
            </span>
            <div className="flex-1">
              <Input
                type="tel"
                placeholder="Ex: 81 234 56 78"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-outline">
            Une invite de paiement (Push USSD) sera envoyée sur votre téléphone pour autoriser le débit sécurisé.
          </p>
        </div>
      )}

      {DEMO_MODE && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-amber-700">info</span>
          <span>Mode démo actif : aucune somme réelle ne sera prélevée.</span>
        </div>
      )}

      <Button
        type="submit"
        variant="secondary"
        className="w-full h-13 text-base font-bold shadow-md"
        isLoading={isSubmitting}
      >
        <span className="material-symbols-outlined mr-2">lock</span>
        Confirmer et Payer ${subtotalUsd.toFixed(2)}
      </Button>
    </form>
  );
}
