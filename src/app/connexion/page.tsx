"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { signInWithEmail, signUpWithEmail, signInWithPhone, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // Form states
  const [phonePrefix, setPhonePrefix] = useState("+243");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (authMethod === "phone") {
        if (!phoneNumber.trim() || phoneNumber.length < 8) {
          setErrorMsg("Veuillez saisir un numéro de téléphone valide (ex: 812 345 678).");
          setIsSubmitting(false);
          return;
        }
        const fullPhone = `${phonePrefix}${phoneNumber.trim().replace(/^0+/, "")}`;
        const res = await signInWithPhone(fullPhone, fullName.trim() || undefined);
        if (res.success) {
          router.push(redirectPath);
        } else {
          setErrorMsg(res.error || "Une erreur est survenue lors de la connexion.");
        }
      } else {
        // Email method
        if (!email.includes("@")) {
          setErrorMsg("Veuillez renseigner une adresse email valide.");
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
          setIsSubmitting(false);
          return;
        }

        if (mode === "login") {
          const res = await signInWithEmail(email, password);
          if (res.success) {
            router.push(redirectPath);
          } else {
            setErrorMsg(res.error || "Identifiants invalides. Vérifiez votre email et mot de passe.");
          }
        } else {
          if (!fullName.trim()) {
            setErrorMsg("Veuillez renseigner votre nom complet.");
            setIsSubmitting(false);
            return;
          }
          const fullPhone = phoneNumber.trim() ? `${phonePrefix}${phoneNumber.trim().replace(/^0+/, "")}` : "";
          const res = await signUpWithEmail(email, password, fullName.trim(), fullPhone);
          if (res.success) {
            router.push(redirectPath);
          } else {
            setErrorMsg(res.error || "Échec de création du compte.");
          }
        }
      }
    } catch {
      setErrorMsg("Erreur réseau inattendue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Contexte de redirection */}
      {redirectPath === "/panier" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-lg">shopping_bag</span>
          <span>Connectez-vous pour finaliser votre commande en toute sécurité. Vos articles vous attendent dans votre panier.</span>
        </div>
      )}

      {redirectPath === "/devenir-vendeur" && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-orange-600 text-lg">storefront</span>
          <span>Pour ouvrir une boutique sur Mwinda Market et choisir votre offre, vous devez être inscrit sur la plateforme.</span>
        </div>
      )}

      <Card className="p-6 sm:p-8">
        <CardHeader className="p-0 pb-6 text-center space-y-2">
          <div className="flex justify-center pb-1">
            <Image
              src="/images/logo-mwinda-h-light.png"
              alt="Mwinda Market"
              width={180}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Connexion à votre compte" : "Créer votre compte Mwinda"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Accédez à vos commandes, adresses et boutiques."
              : "Rejoignez la communauté d'acheteurs et vendeurs panafricains."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-5">
          {/* Toggle Login / Register */}
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl border border-outline-variant text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMsg(""); }}
              className={`py-2 rounded-lg transition-all ${
                mode === "login"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-outline hover:text-primary"
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setErrorMsg(""); }}
              className={`py-2 rounded-lg transition-all ${
                mode === "register"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-outline hover:text-primary"
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* Méthode Phone / Email */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMethod("phone"); setErrorMsg(""); }}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition ${
                authMethod === "phone"
                  ? "border-secondary text-secondary"
                  : "border-transparent text-outline hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-base">smartphone</span>
              <span>Par Téléphone (Mobile)</span>
            </button>
            <span className="text-outline-variant">|</span>
            <button
              type="button"
              onClick={() => { setAuthMethod("email"); setErrorMsg(""); }}
              className={`flex items-center gap-1.5 pb-1 border-b-2 transition ${
                authMethod === "email"
                  ? "border-secondary text-secondary"
                  : "border-transparent text-outline hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>Par Email</span>
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary">Nom complet</label>
                <Input
                  type="text"
                  placeholder="Ex: Jean Kasongo"
                  icon="badge"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            {authMethod === "phone" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary">Numéro de téléphone</label>
                <div className="flex gap-2">
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="h-11 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="+243">🇨🇩 +243 (RDC)</option>
                    <option value="+242">🇨🇬 +242 (Congo-Brazza)</option>
                    <option value="+250">🇷🇼 +250 (Rwanda)</option>
                    <option value="+257">🇧🇮 +257 (Burundi)</option>
                    <option value="+225">🇨🇮 +225 (Côte d&apos;Ivoire)</option>
                    <option value="+237">🇨🇲 +237 (Cameroun)</option>
                    <option value="+33">🇫🇷 +33 (France)</option>
                  </select>
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="812 345 678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-outline">
                  Compatible avec M-Pesa, Airtel Money et Orange Money.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary">Adresse Email</label>
                  <Input
                    type="email"
                    placeholder="nom@exemple.com"
                    icon="mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary">Mot de passe</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    icon="lock"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-12 text-sm font-bold shadow-md"
              isLoading={isSubmitting}
            >
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-on-surface-variant">
            En continuant, vous acceptez les{" "}
            <Link href="/conditions" className="text-secondary hover:underline font-semibold">
              Conditions Générales
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="text-secondary hover:underline font-semibold">
              Politique de Confidentialité
            </Link>{" "}
            de Mwinda Market.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-10 sm:py-16">
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-outline">Chargement...</div>}>
          <ConnexionContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
