"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { VENDOR_PLANS } from "@/data/vendorPlans";

interface VendorRegistrationFormProps {
  selectedPlanId: string;
}

export function VendorRegistrationForm({ selectedPlanId }: VendorRegistrationFormProps) {
  const { user, isAuthenticated } = useAuth();
  const selectedPlan = VENDOR_PLANS.find((p) => p.id === selectedPlanId) || VENDOR_PLANS[0];

  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("mode");
  const [city, setCity] = useState("Kinshasa");
  const [phone, setPhone] = useState(user?.phone?.replace(/^\+243/, "") || "");
  const [email] = useState(user?.email || "");
  const [description, setDescription] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // RÈGLE MÉTIER STRICTE : Seul un utilisateur connecté peut ouvrir une boutique
  if (!isAuthenticated) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-secondary/40 p-8 text-center max-w-xl mx-auto space-y-4 shadow-card">
        <div className="w-16 h-16 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">storefront</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-primary">
            Inscription requise pour ouvrir une boutique
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Pour associer votre future boutique à un compte sécurisé et recevoir vos reversements Mobile Money en toute transparence, veuillez vous connecter ou créer un compte.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/connexion?redirect=/devenir-vendeur">
            <Button variant="secondary" className="px-8 h-12 text-sm font-bold shadow-md">
              <span className="material-symbols-outlined mr-2">person_add</span>
              Se connecter ou s&apos;inscrire pour postuler
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!shopName.trim()) {
      setErrorMsg("Veuillez renseigner le nom de votre boutique.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Veuillez accepter la charte et les conditions vendeurs de Mwinda Market.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name: user?.fullName || "Vendeur Mwinda",
          shop_name: shopName.trim(),
          category,
          location: city,
          phone: phone.trim()
            ? `+243${phone.trim().replace(/^0+/, "")}`
            : user?.phone || "",
          email: email.trim() || user?.email || "vendeur@mwinda.market",
          notes: `Offre choisie: ${selectedPlan.name} (${selectedPlan.priceUsd}$/mois, ${selectedPlan.commissionRate}% commission). Description: ${description}`,
          country_code: "CD",
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setErrorMsg(
          payload?.error ||
            "Impossible d'enregistrer la candidature. Réessayez plus tard."
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMsg(
        "Réseau indisponible. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-secondary/30 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-card space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-4xl">task_alt</span>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Demande d&apos;adhésion enregistrée
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-primary font-display">
            Félicitations, votre dossier est en cours d&apos;examen !
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Votre demande pour la boutique <strong className="text-primary font-bold">« {shopName} »</strong> sous le forfait <strong className="text-secondary font-bold">{selectedPlan.name}</strong> a bien été reçue. Notre équipe vous contactera sous 24h ouvrées.
          </p>
        </div>

        <div className="p-4 bg-surface-container rounded-xl text-xs text-left space-y-1.5 border border-outline-variant">
          <div className="flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined text-secondary text-base">support_agent</span>
            <span>Accompagnement Mwinda Vendeur</span>
          </div>
          <p className="text-on-surface-variant text-[11px] leading-relaxed">
            Un agent onboarding vous assistera pour la prise de vue de vos produits, la configuration de votre Mobile Money et la mise en ligne de votre boutique.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/vendeur/dashboard">
            <Button variant="secondary" className="w-full sm:w-auto">
              <span className="material-symbols-outlined mr-1.5 text-base">dashboard</span>
              Accéder à l&apos;espace vendeur
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 sm:p-8" id="inscription-vendeur">
      <CardHeader className="p-0 pb-6 border-b border-outline-variant space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl sm:text-2xl">
            Ouvrir ma boutique
          </CardTitle>
          <span className="text-xs font-bold px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full border border-secondary/20">
            Forfait : {selectedPlan.name} ({selectedPlan.priceUsd}$/m)
          </span>
        </div>
        <CardDescription>
          Remplissez les informations de votre commerce pour commencer à vendre.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-6 space-y-5">
        {errorMsg && (
          <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary">Nom de votre boutique *</label>
              <Input
                type="text"
                placeholder="Ex: Mode & Élégance Kin"
                icon="storefront"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-primary">Catégorie principale</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="mode">Mode & Habillement</option>
                <option value="electronique">Électronique & High-Tech</option>
                <option value="maison">Maison & Décoration</option>
                <option value="beaute">Beauté & Cosmétiques</option>
                <option value="alimentation">Alimentation & Produits Locaux</option>
                <option value="artisanat">Artisanat Panafricain</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary">Ville d&apos;activité</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="Kinshasa">Kinshasa</option>
                <option value="Lubumbashi">Lubumbashi</option>
                <option value="Goma">Goma</option>
                <option value="Kisangani">Kisangani</option>
                <option value="Matadi">Matadi</option>
                <option value="Bukavu">Bukavu</option>
                <option value="Kolwezi">Kolwezi</option>
                <option value="Brazzaville">Brazzaville</option>
                <option value="Pointe-Noire">Pointe-Noire</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-primary">Numéro WhatsApp / Téléphone</label>
              <div className="flex gap-2">
                <span className="h-11 px-3 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-primary flex items-center">
                  🇨🇩 +243
                </span>
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="81 234 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-primary">Description de votre commerce</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les produits que vous vendez, vos marques, votre expérience..."
              className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-sm text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant text-xs space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-outline-variant text-secondary focus:ring-secondary"
              />
              <span className="text-on-surface leading-snug">
                J&apos;accepte les conditions générales vendeurs, le versement de la commission de{" "}
                <strong className="text-primary font-bold">{selectedPlan.commissionRate}%</strong> sur les ventes et m&apos;engage à fournir des produits authentiques et de qualité.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full h-12 text-sm font-bold shadow-md"
            isLoading={isSubmitting}
          >
            <span className="material-symbols-outlined mr-2">send</span>
            Soumettre ma demande d&apos;ouverture
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
