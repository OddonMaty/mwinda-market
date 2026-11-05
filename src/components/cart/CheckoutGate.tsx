"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

type PaymentMode = "manual_mm" | "cash_on_delivery";

interface CheckoutGateProps {
  subtotalUsd: number;
  itemCount: number;
  items?: Array<{ id: string; title: string; image: string; usdPrice: number; quantity: number; shopName?: string }>;
  onOrderSuccess: (orderNumber: string) => void;
}

export function CheckoutGate({
  subtotalUsd,
  itemCount,
  items = [],
  onOrderSuccess,
}: CheckoutGateProps) {
  const { user, isAuthenticated } = useAuth();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("manual_mm");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+243/, "") || "");
  const [customerName, setCustomerName] = useState(user?.fullName || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "Kinshasa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [orderRef, setOrderRef] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-secondary/40 p-6 sm:p-8 shadow-card text-center space-y-4">
        <div className="w-14 h-14 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl">lock</span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-primary">Connexion requise</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Connectez-vous pour passer commande. Le paiement se fait manuellement pour le moment.
          </p>
        </div>
        <Link href="/connexion?redirect=/panier">
          <Button variant="secondary" className="px-8 h-12 text-sm font-bold">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customerName.trim() || !address.trim() || !phoneNumber.trim()) {
      setFormError("Nom, adresse et téléphone sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    const generatedRef = `MW-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: generatedRef,
          amount_usd: subtotalUsd,
          customer_name: customerName.trim(),
          customer_phone: phoneNumber.startsWith("+") ? phoneNumber : `+243${phoneNumber.replace(/^0+/, "")}`,
          customer_email: user?.email || null,
          delivery_address: address.trim(),
          delivery_city: city,
          payment_method: paymentMode,
          payment_status: "pending",
          status: "pending_payment",
          items: items.map((it) => ({
            product_id: it.id,
            title: it.title,
            quantity: it.quantity,
            unit_usd_price: it.usdPrice,
            image: it.image,
            shop_name: it.shopName,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Impossible d'enregistrer la commande.");
      }

      setOrderRef(generatedRef);
      onOrderSuccess(generatedRef);
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderRef) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-4">
        <h3 className="text-lg font-bold text-primary">Commande enregistrée</h3>
        <p className="text-sm">Référence : <strong>{orderRef}</strong></p>
        {paymentMode === "manual_mm" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-2">
            <p className="font-bold text-amber-900">Paiement Mobile Money manuel</p>
            <p className="text-amber-950">
              Veuillez effectuer un transfert de <strong>${subtotalUsd.toFixed(2)} USD</strong> à l'un des comptes officiels Mwinda Market :
            </p>
            <div className="bg-white/80 border border-amber-300 rounded-lg p-2.5 font-mono text-xs space-y-1 text-slate-800">
              <div>📱 <strong>Vodacom M-Pesa :</strong> +243 818 900 125</div>
              <div>📱 <strong>Airtel Money :</strong> +243 999 000 000</div>
              <div>📱 <strong>Orange Money :</strong> +243 890 000 000</div>
            </div>
            <p className="text-amber-900 font-semibold">
              ⚠️ Indiquez la référence <span className="bg-amber-200 px-1.5 py-0.5 rounded font-mono font-bold text-black">{orderRef}</span> en motif ou envoyez la capture par WhatsApp.
            </p>
            <p className="text-xs text-amber-800">
              Un agent Mwinda validera votre paiement dans le back-office sous 15 minutes, puis le vendeur expédiera votre commande.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-bold">Paiement à la livraison</p>
            <p>Vous paierez en cash ou Mobile Money au livreur. Commande confirmée pour préparation.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleCheckout} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
        <h3 className="text-base font-bold text-primary">Livraison &amp; Paiement</h3>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          Livraison incluse (0 $)
        </span>
      </div>

      {formError && (
        <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold">Nom</label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-bold">Ville</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-11 px-3 border border-outline-variant rounded-xl text-xs font-bold">
            <option>Kinshasa</option>
            <option>Lubumbashi</option>
            <option>Goma</option>
            <option>Kisangani</option>
            <option>Matadi</option>
            <option>Bukavu</option>
            <option>Kolwezi</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold">Adresse de livraison</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>

      <div>
        <label className="text-xs font-bold">Téléphone</label>
        <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="81 234 56 78" required />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold">Mode de paiement</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMode("manual_mm")}
            className={`p-3 rounded-xl border text-left text-sm ${
              paymentMode === "manual_mm" ? "border-secondary bg-secondary-fixed/30" : "border-outline-variant"
            }`}
          >
            <strong>Mobile Money manuel</strong>
            <p className="text-xs text-on-surface-variant">Vous payez puis un agent confirme</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("cash_on_delivery")}
            className={`p-3 rounded-xl border text-left text-sm ${
              paymentMode === "cash_on_delivery" ? "border-secondary bg-secondary-fixed/30" : "border-outline-variant"
            }`}
          >
            <strong>Paiement à la livraison</strong>
            <p className="text-xs text-on-surface-variant">Cash ou Mobile Money au livreur</p>
          </button>
        </div>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
        Aucun prélèvement automatique. Paiement manuel uniquement pour le moment.
      </div>

      <Button type="submit" variant="secondary" className="w-full h-12 font-bold" isLoading={isSubmitting}>
        Confirmer la commande — ${subtotalUsd.toFixed(2)}
      </Button>
    </form>
  );
}
