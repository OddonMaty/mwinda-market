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
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");

  // Form states
  const [phonePrefix, setPhonePrefix] = useState("+243");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Si déjà authentifié, rediriger
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, redirectPath, router]);

  // ─── Connexion Google OAuth ─────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      // Redirection vers l'endpoint Google OAuth
      window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
    } catch {
      setErrorMsg("Impossible de se connecter avec Google. Réessayez.");
      setGoogleLoading(false);
    }
  };

  // ─── Formulaire Email / Téléphone ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
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
          // INSCRIPTION — redirection vers accueil après succès
          if (!fullName.trim()) {
            setErrorMsg("Veuillez renseigner votre nom complet.");
            setIsSubmitting(false);
            return;
          }
          const fullPhone = phoneNumber.trim()
            ? `${phonePrefix}${phoneNumber.trim().replace(/^0+/, "")}`
            : "";
          const res = await signUpWithEmail(email, password, fullName.trim(), fullPhone);
          if (res.success) {
            setSuccessMsg("Compte créé avec succès ! Redirection en cours…");
            // Toujours vers l'accueil après inscription (sauf si redirect explicite)
            setTimeout(() => router.push(redirectPath === "/" ? "/" : redirectPath), 800);
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
          <span>Connectez-vous pour finaliser votre commande. Vos articles vous attendent dans votre panier.</span>
        </div>
      )}
      {redirectPath === "/devenir-vendeur" && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-orange-600 text-lg">storefront</span>
          <span>Pour ouvrir une boutique sur Mwinda Market, vous devez être inscrit sur la plateforme.</span>
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
              onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
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
              onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`py-2 rounded-lg transition-all ${
                mode === "register"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-outline hover:text-primary"
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* ── Bouton Google ── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-outline-variant bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 shadow-sm transition disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            <span>{mode === "login" ? "Se connecter avec Google" : "S'inscrire avec Google"}</span>
          </button>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-outline font-semibold">ou continuer avec</span>
            </div>
          </div>

          {/* Méthode Phone / Email */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
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
            <span className="text-outline-variant">|</span>
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
              <span>Par Téléphone</span>
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary">Nom complet *</label>
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
                    <option value="+242">🇨🇬 +242 (Congo-B)</option>
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
                <p className="text-[11px] text-outline">Compatible M-Pesa, Airtel Money, Orange Money.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary">Adresse Email *</label>
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
                  <label className="text-xs font-bold text-primary">Mot de passe *</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    icon="lock"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {mode === "register" && (
                    <p className="text-[11px] text-outline">Minimum 6 caractères.</p>
                  )}
                </div>
                {/* Numéro téléphone optionnel en inscription email */}
                {mode === "register" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary">
                      Numéro WhatsApp <span className="font-normal text-outline">(optionnel)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="h-11 px-3 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                      >
                        <option value="+243">🇨🇩 +243</option>
                        <option value="+242">🇨🇬 +242</option>
                        <option value="+250">🇷🇼 +250</option>
                        <option value="+33">🇫🇷 +33</option>
                      </select>
                      <div className="flex-1">
                        <Input
                          type="tel"
                          placeholder="812 345 678 (facultatif)"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-12 text-sm font-bold shadow-md"
              isLoading={isSubmitting}
            >
              {mode === "login" ? "Se connecter" : "Créer mon compte gratuitement"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="text-center">
              <Link href="/mot-de-passe-oublie" className="text-xs text-secondary hover:underline font-semibold">
                Mot de passe oublié ?
              </Link>
            </div>
          )}

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
