"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { convertUsdToCurrency, formatLocalPrice } from "@/lib/currency";

type VendorTab = "overview" | "orders" | "products" | "finances" | "settings";

interface VendorProfileData {
  id: string;
  shopName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  city: string;
  address?: string | null;
  whatsapp?: string | null;
  plan: string;
  isVerified: boolean;
  isActive: boolean;
  _count?: {
    products: number;
    orders: number;
    withdrawals: number;
  };
}

interface BalanceData {
  plan: string;
  totalSales: number;
  totalCommission: number;
  totalEarned: number;
  withdrawn: number;
  available: number;
  ordersCount: number;
}

interface VendorOrder {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  amountUsd: number;
  vendorEarningUsd: number;
  commissionUsd: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitUsdPrice: number;
    imageUrl?: string | null;
  }>;
}

interface VendorProduct {
  id: string;
  title: string;
  priceUsd: number;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface WithdrawalItem {
  id: string;
  amountUsd: number;
  method: string;
  details?: string | null;
  status: string;
  createdAt: string;
  processedAt?: string | null;
}

export default function VendorDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VendorDashboardInner />
    </Suspense>
  );
}

function VendorDashboardInner() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const initialTab = (searchParams.get("tab") as VendorTab) || "overview";
  const [activeTab, setActiveTab] = useState<VendorTab>(initialTab);

  // Data States
  const [vendor, setVendor] = useState<VendorProfileData | null>(null);
  const [pendingApplication, setPendingApplication] = useState<any | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Product Form State
  const [prodTitle, setProdTitle] = useState("");
  const [prodCategory, setProdCategory] = useState("Électronique");
  const [prodPriceUsd, setProdPriceUsd] = useState("");
  const [prodStock, setProdStock] = useState("5");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodUploading, setProdUploading] = useState(false);
  const [prodSubmitting, setProdSubmitting] = useState(false);
  const [prodSuccessMsg, setProdSuccessMsg] = useState("");
  const [prodErrorMsg, setProdErrorMsg] = useState("");

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("mobile_money");
  const [withdrawOperator, setWithdrawOperator] = useState("M-Pesa (Vodacom)");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState("");
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState("");

  // Settings Form State
  const [shopNameEdit, setShopNameEdit] = useState("");
  const [shopTaglineEdit, setShopTaglineEdit] = useState("");
  const [shopWhatsappEdit, setShopWhatsappEdit] = useState("");
  const [shopAddressEdit, setShopAddressEdit] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  // Charge toutes les données vendeur
  const loadDashboardData = async () => {
    try {
      // 1. Profil & boutique
      const profRes = await fetch("/api/vendor/profile");
      if (profRes.ok) {
        const profData = await profRes.json();
        setVendor(profData.vendor || null);
        setPendingApplication(profData.application || null);
        if (profData.vendor) {
          setShopNameEdit(profData.vendor.shopName || "");
          setShopTaglineEdit(profData.vendor.tagline || "");
          setShopWhatsappEdit(profData.vendor.whatsapp || "");
          setShopAddressEdit(profData.vendor.address || "");
        }
      }

      // 2. Finances & solde
      const balRes = await fetch("/api/vendor/balance");
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData);
      }

      // 3. Commandes
      const ordRes = await fetch("/api/vendor/orders");
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }

      // 4. Produits
      const prodRes = await fetch("/api/vendor/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }

      // 5. Retraits
      const wthRes = await fetch("/api/vendor/withdrawals");
      if (wthRes.ok) {
        const wthData = await wthRes.json();
        setWithdrawals(wthData.withdrawals || []);
      }
    } catch (err) {
      console.error("Erreur de chargement des données vendeur:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/connexion?redirect=/vendeur/dashboard");
      return;
    }
    if (user) {
      loadDashboardData();
    }
  }, [user, isLoading, router]);

  // Synchronise le paramètre d'URL quand on change d'onglet
  const switchTab = (tab: VendorTab) => {
    setActiveTab(tab);
    router.replace(`/vendeur/dashboard?tab=${tab}`, { scroll: false });
  };

  // Upload image produit
  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProdUploading(true);
    setProdErrorMsg("");
    setProdSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/vendor/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setProdImageUrl(data.url);
        setProdSuccessMsg("Photo enregistrée avec succès !");
      } else {
        setProdErrorMsg(data.error || "Échec du téléversement de la photo.");
      }
    } catch {
      setProdErrorMsg("Erreur réseau pendant l'upload.");
    } finally {
      setProdUploading(false);
    }
  };

  // Publication d'un produit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdErrorMsg("");
    setProdSuccessMsg("");

    if (!prodTitle.trim() || !prodPriceUsd) {
      setProdErrorMsg("Veuillez renseigner le nom et le prix en USD.");
      return;
    }

    setProdSubmitting(true);
    try {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prodTitle.trim(),
          category: prodCategory,
          priceUsd: Number(prodPriceUsd),
          stock: Number(prodStock) || 0,
          description: prodDescription.trim(),
          imageUrl: prodImageUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProdErrorMsg(data.error || "Impossible d'ajouter l'article.");
      } else {
        setProdSuccessMsg("Félicitations ! L'article a été publié sur votre boutique.");
        setProdTitle("");
        setProdPriceUsd("");
        setProdStock("5");
        setProdDescription("");
        setProdImageUrl("");
        // Recharger les produits
        const pRes = await fetch("/api/vendor/products");
        if (pRes.ok) {
          const pData = await pRes.json();
          setProducts(pData.products || []);
        }
      }
    } catch {
      setProdErrorMsg("Erreur de connexion au serveur.");
    } finally {
      setProdSubmitting(false);
    }
  };

  // Suppression d'un produit
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment retirer cet article de la vente ?")) return;
    try {
      const res = await fetch(`/api/vendor/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Impossible de supprimer ce produit.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  // Mise à jour de statut de commande
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Rafraîchir
        const oRes = await fetch("/api/vendor/orders");
        if (oRes.ok) {
          const oData = await oRes.json();
          setOrders(oData.orders || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Demande de retrait avec validation administrateur
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg("");
    setWithdrawSuccessMsg("");

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawErrorMsg("Veuillez indiquer un montant valide.");
      return;
    }

    if (!withdrawAccount.trim()) {
      setWithdrawErrorMsg("Veuillez préciser le numéro de téléphone ou le compte bénéficiaire.");
      return;
    }

    if (balance && amount > balance.available) {
      setWithdrawErrorMsg(`Solde insuffisant. Vous disposez de ${balance.available.toFixed(2)}$ USD.`);
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const details =
        withdrawMethod === "mobile_money"
          ? `${withdrawOperator} : ${withdrawAccount.trim()}`
          : withdrawAccount.trim();

      const res = await fetch("/api/vendor/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUsd: amount,
          method: withdrawMethod === "mobile_money" ? "Mobile Money" : "Virement Bancaire",
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWithdrawErrorMsg(data.error || "Impossible d'enregistrer la demande de retrait.");
      } else {
        setWithdrawSuccessMsg(
          "Demande de retrait enregistrée avec succès ! Elle a été transmise au panel administrateur pour validation et transfert."
        );
        setWithdrawAmount("");
        setWithdrawAccount("");

        // Recharger le solde et l'historique
        const balRes = await fetch("/api/vendor/balance");
        if (balRes.ok) setBalance(await balRes.json());
        const wthRes = await fetch("/api/vendor/withdrawals");
        if (wthRes.ok) setWithdrawals((await wthRes.json()).withdrawals || []);
      }
    } catch {
      setWithdrawErrorMsg("Erreur lors de la soumission de la demande.");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Sauvegarde des réglages boutique
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopNameEdit,
          tagline: shopTaglineEdit,
          whatsapp: shopWhatsappEdit,
          address: shopAddressEdit,
        }),
      });
      if (res.ok) {
        setSettingsMsg("Coordonnées de la boutique enregistrées avec succès !");
        setTimeout(() => setSettingsMsg(""), 3500);
      }
    } catch {
      setSettingsMsg("Erreur lors de l'enregistrement.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Calcul du prix équivalent en CDF pour le produit en cours de saisie
  const livePriceCdf = useMemo(() => {
    const val = Number(prodPriceUsd);
    if (!val || isNaN(val)) return null;
    const cdf = convertUsdToCurrency(val, "CDF");
    return formatLocalPrice(cdf, "CDF");
  }, [prodPriceUsd]);

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-[#0B1B3D]">Chargement de votre Espace Vendeur…</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas encore vendeur approuvé
  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-[#0B1B3D] text-white p-4 border-b border-white/10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo-mwinda.png" alt="Mwinda" width={32} height={32} />
              <span className="font-black text-lg font-display">Mwinda Market</span>
            </Link>
            <Link href="/mon-compte" className="text-xs text-slate-300 hover:text-white">
              Mon compte client &rarr;
            </Link>
          </div>
        </header>

        <main className="max-w-lg mx-auto p-6 text-center my-auto">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-300 shadow-sm">
            <span className="material-symbols-outlined text-3xl">store</span>
          </div>

          {pendingApplication ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Candidature en cours de validation
              </div>
              <h1 className="text-2xl font-black text-[#0B1B3D] font-display">
                Boutique « {pendingApplication.shopName} »
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Votre dossier légal a été transmis avec succès. L’équipe d’administration Mwinda Market examine actuellement vos informations (RCCM, Id. Nat, coordonnées). Dès approbation, votre tableau de bord vendeur sera activé.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow hover:bg-[#c2410c] transition"
                >
                  Retourner à l'accueil
                </Link>
                <Link
                  href="/mon-compte"
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
                >
                  Mon profil client
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-black text-[#0B1B3D] font-display">
                Ouvrez votre Boutique Mwinda
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vous n'avez pas encore de boutique active sur Mwinda Market. Rejoignez le réseau de vendeurs certifiés et commencez à vendre vos produits à Kinshasa et dans toute la RDC.
              </p>
              <div className="pt-2">
                <Link
                  href="/devenir-vendeur"
                  className="px-6 py-3 bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow hover:bg-[#c2410c] transition inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add_business</span>
                  <span>Remplir le dossier vendeur &rarr;</span>
                </Link>
              </div>
            </div>
          )}
        </main>

        <footer className="p-4 text-center text-xs text-slate-400 border-t border-slate-200">
          Mwinda Market — Espace Vendeurs Partenaires
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* ─── EN-TÊTE PREMIUM VENDEUR ─── */}
      <header className="bg-[#0B1B3D] text-white sticky top-0 z-40 border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                <Image src="/images/logo-mwinda.png" alt="Mwinda" width={28} height={28} />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-sm text-white font-display tracking-tight block">
                  Mwinda Market
                </span>
                <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider block -mt-1">
                  Espace Vendeur Pro
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

            {/* Identité Boutique */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-xs">
                {vendor.shopName}
              </span>
              {vendor.isVerified && (
                <span className="inline-flex items-center gap-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-sky-400/30">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Certifié
                </span>
              )}
              <span className="bg-[#EA580C] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Plan {vendor.plan}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition"
              title="Voir le site public"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span className="hidden md:inline">Voir la Marketplace</span>
            </Link>

            <Link
              href="/mon-compte"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition"
              title="Espace acheteur personnel"
            >
              <span className="material-symbols-outlined text-sm">person</span>
              <span className="hidden md:inline">Mon Compte Client</span>
            </Link>

            <button
              onClick={() => signOut().then(() => router.push("/"))}
              className="p-1.5 text-slate-400 hover:text-red-300 rounded-lg transition"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Style Alibaba Seller Center) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-bold border-t border-white/10">
          <button
            onClick={() => switchTab("overview")}
            className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#EA580C] text-[#EA580C]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Vue d'ensemble</span>
          </button>

          <button
            onClick={() => switchTab("orders")}
            className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "orders"
                ? "border-[#EA580C] text-[#EA580C]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">shopping_cart</span>
            <span>Mes Ventes & Commandes</span>
            {orders.length > 0 && (
              <span className="bg-[#EA580C] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab("products")}
            className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "products"
                ? "border-[#EA580C] text-[#EA580C]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Articles & Catalogue</span>
            <span className="bg-white/10 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => switchTab("finances")}
            className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "finances"
                ? "border-[#EA580C] text-[#EA580C]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Finances & Retraits</span>
            {balance && balance.available > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                ${balance.available.toFixed(0)}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab("settings")}
            className={`py-3 px-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "settings"
                ? "border-[#EA580C] text-[#EA580C]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">settings</span>
            <span>Paramètres Boutique</span>
          </button>
        </div>
      </header>

      {/* ─── CORPS DU TABLEAU DE BORD ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ══════════════════════════════════════════════════════════
            ONGLET 1 : VUE D'ENSEMBLE (KPIs & SYNTHÈSE)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Bannière de Bienvenue Boutique */}
            <div className="bg-gradient-to-r from-[#0B1B3D] via-[#1E293B] to-[#0B1B3D] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-3xl text-orange-400">storefront</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black font-display text-white">
                      {vendor.shopName}
                    </h1>
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                      Boutique Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {vendor.tagline || "Partenaire certifié de la marketplace Mwinda"} &bull; {vendor.city || "Kinshasa"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => switchTab("products")}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Ajouter un article</span>
                </button>

                <button
                  onClick={() => switchTab("finances")}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                  <span>Retirer mes gains</span>
                </button>
              </div>
            </div>

            {/* Cartes Métriques Clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Solde Disponible
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-xl">payments</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">
                  ${balance ? balance.available.toFixed(2) : "0.00"} USD
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Retirable par Mobile Money / Banque
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Revenus Vendeur
                  </span>
                  <span className="material-symbols-outlined text-blue-600 text-xl">trending_up</span>
                </div>
                <p className="text-2xl font-black text-[#0B1B3D]">
                  ${balance ? balance.totalEarned.toFixed(2) : "0.00"} USD
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Après déduction des commissions Mwinda
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Articles en Vente
                  </span>
                  <span className="material-symbols-outlined text-[#EA580C] text-xl">inventory_2</span>
                </div>
                <p className="text-2xl font-black text-[#0B1B3D]">{products.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Visibles sur la marketplace publique
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Commandes
                  </span>
                  <span className="material-symbols-outlined text-purple-600 text-xl">receipt_long</span>
                </div>
                <p className="text-2xl font-black text-[#0B1B3D]">{orders.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {orders.filter((o) => o.status === "paid" || o.status === "preparing").length} commande(s) à préparer
                </p>
              </div>
            </div>

            {/* Aperçu rapide des Commandes Récentes */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0B1B3D]">Ventes & Commandes récentes</h2>
                  <p className="text-xs text-slate-500">
                    Commandes passées par les acheteurs sur vos articles
                  </p>
                </div>
                <button
                  onClick={() => switchTab("orders")}
                  className="text-xs font-bold text-[#EA580C] hover:underline"
                >
                  Voir toutes les ventes &rarr;
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-400">shopping_bag</span>
                  <p>Aucune commande enregistrée pour l'instant.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ajoutez vos articles dans votre catalogue pour commencer à recevoir des commandes !
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="text-left p-3">Réf / Date</th>
                        <th className="text-left p-3">Client</th>
                        <th className="text-left p-3">Articles</th>
                        <th className="text-left p-3">Votre Gain Net</th>
                        <th className="text-left p-3">Statut</th>
                        <th className="text-right p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3">
                            <span className="font-mono font-bold text-[#0B1B3D]">{o.reference}</span>
                            <div className="text-[10px] text-slate-400">
                              {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">{o.customerName}</span>
                            <div className="text-[10px] text-slate-400">{o.deliveryCity}</div>
                          </td>
                          <td className="p-3">
                            {o.items?.length || 1} article(s)
                          </td>
                          <td className="p-3 font-bold text-emerald-700">
                            ${Number(o.vendorEarningUsd || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[10px]">
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => switchTab("orders")}
                              className="text-xs text-[#EA580C] font-bold hover:underline"
                            >
                              Gérer &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 2 : VENTES & COMMANDES
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-[#0B1B3D] font-display">Gestion des Ventes & Commandes</h1>
                <p className="text-xs text-slate-500">
                  Suivez vos commandes payées, préparez les colis et confirmez la remise aux livreurs
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {orders.length} commande(s) totale(s)
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">shopping_cart</span>
                <p className="font-bold text-sm text-[#0B1B3D]">Aucune commande pour le moment</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Dès qu'un client achète un article de votre boutique sur Mwinda Market, la commande s'affichera ici avec le paiement sécurisé Escrow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-[#0B1B3D]">{o.reference}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Paiement {o.paymentStatus === "paid" ? "Validé" : "En attente"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Date : {new Date(o.createdAt).toLocaleString("fr-FR")} &bull; Mode : {o.paymentMethod === "manual_mm" ? "Mobile Money" : "Cash à la livraison"}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">Votre gain net vendeur</div>
                        <div className="text-lg font-black text-emerald-700">
                          ${Number(o.vendorEarningUsd || 0).toFixed(2)} USD
                        </div>
                      </div>
                    </div>

                    {/* Coordonnées Client & Livraison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-700 block">Destinataire :</span>
                        <span className="text-slate-800 font-semibold">{o.customerName}</span>
                        <span className="text-slate-500 font-mono block">{o.customerPhone}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">Adresse de livraison :</span>
                        <span className="text-slate-800">{o.deliveryAddress || "À préciser"}, {o.deliveryCity}</span>
                      </div>
                    </div>

                    {/* Articles de la commande */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Articles commandés :
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {o.items?.map((it) => (
                          <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white">
                            <div className="flex items-center gap-2.5">
                              {it.imageUrl && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                                  <Image src={it.imageUrl} alt={it.title} fill className="object-cover" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800">{it.title}</p>
                                <p className="text-slate-400">Quantité : {it.quantity}</p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-800">
                              ${(Number(it.unitUsdPrice) * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions de livraison */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <div className="text-xs">
                        <span className="text-slate-500">Statut actuel du colis : </span>
                        <span className="font-bold uppercase text-[#0B1B3D] bg-slate-100 px-2 py-0.5 rounded">
                          {o.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {o.status === "paid" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, "preparing")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                            <span>Colis prêt / En préparation</span>
                          </button>
                        )}

                        {o.status === "preparing" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, "shipped")}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">local_shipping</span>
                            <span>Remis au transporteur / Livreur</span>
                          </button>
                        )}

                        {o.status === "shipped" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, "delivered")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>Colis réceptionné par le client</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 3 : ARTICLES & CATALOGUE (AJOUTER & GÉRER)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "products" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-[#0B1B3D] font-display">Articles & Catalogue Boutique</h1>
                <p className="text-xs text-slate-500">
                  Publiez de nouveaux articles et gérez les stocks de votre boutique
                </p>
              </div>
              <span className="text-xs font-bold bg-[#EA580C]/10 text-[#EA580C] px-3 py-1 rounded-full border border-[#EA580C]/20">
                {products.length} article(s) publié(s)
              </span>
            </div>

            {/* Formulaire d'ajout d'article */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="material-symbols-outlined text-xl text-[#EA580C]">add_circle</span>
                <h2 className="text-base font-bold text-[#0B1B3D]">Ajouter un nouvel article en vente</h2>
              </div>

              {prodSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{prodSuccessMsg}</span>
                </div>
              )}

              {prodErrorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{prodErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Nom / Titre complet de l'article *
                    </label>
                    <input
                      type="text"
                      value={prodTitle}
                      onChange={(e) => setProdTitle(e.target.value)}
                      placeholder="Ex: Écran Smart TV 43 Pouces 4K Ultra HD"
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Catégorie</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition"
                    >
                      <option value="Électronique">Électronique</option>
                      <option value="Smartphones & Tablettes">Smartphones & Tablettes</option>
                      <option value="Mode & Habillement">Mode & Habillement</option>
                      <option value="Maison & Décoration">Maison & Décoration</option>
                      <option value="Beauté & Santé">Beauté & Santé</option>
                      <option value="Alimentation & Épicerie">Alimentation & Épicerie</option>
                      <option value="Énergie Solaire & Onduleurs">Énergie Solaire & Onduleurs</option>
                      <option value="Informatique & Ordinateurs">Informatique & Ordinateurs</option>
                      <option value="Électroménager">Électroménager</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Stock disponible</label>
                    <input
                      type="number"
                      min="1"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      placeholder="Ex: 10"
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Prix de vente en USD ($) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        value={prodPriceUsd}
                        onChange={(e) => setProdPriceUsd(e.target.value)}
                        placeholder="Ex: 85.00"
                        className="w-full text-xs p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition font-bold"
                        required
                      />
                      <span className="absolute right-3 top-3 text-xs font-black text-slate-400">USD</span>
                    </div>
                    {livePriceCdf && (
                      <p className="text-[11px] font-semibold text-emerald-600">
                        ≈ Équivalent automatique : <span className="font-mono">{livePriceCdf}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Photo de l'article (Fichier ou URL)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadProductImage}
                        className="text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white hover:file:bg-[#1E293B] cursor-pointer"
                      />
                      {prodUploading && <span className="text-xs text-[#EA580C] animate-pulse">Envoi…</span>}
                    </div>
                    {prodImageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 relative">
                          <Image src={prodImageUrl} alt="Aperçu" fill className="object-cover" />
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold truncate">
                          Photo prête
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Description & Caractéristiques</label>
                    <textarea
                      rows={3}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Détails du produit, garantie, état, spécifications techniques…"
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={prodSubmitting}
                  className="px-6 py-3 bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">publish</span>
                  <span>{prodSubmitting ? "Publication en cours…" : "Publier l'article sur Mwinda"}</span>
                </button>
              </form>
            </div>

            {/* Liste des articles du catalogue */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#0B1B3D]">Catalogue de ma boutique ({products.length})</h2>

              {products.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  Vous n'avez pas encore publié d'articles. Remplissez le formulaire ci-dessus pour ajouter votre premier produit.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => {
                    const cdf = convertUsdToCurrency(Number(p.priceUsd), "CDF");
                    const formattedCdf = formatLocalPrice(cdf, "CDF");
                    return (
                      <div
                        key={p.id}
                        className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-3 bg-white hover:border-[#EA580C]/40 transition group"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-2xl">image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">
                              {p.category || "Général"}
                            </span>
                            <h3 className="text-xs font-bold text-[#0B1B3D] line-clamp-2">
                              {p.title}
                            </h3>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-[#EA580C]">
                                ${Number(p.priceUsd).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ≈ {formattedCdf}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Stock : <strong className="text-slate-800">{p.stock}</strong>
                          </span>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-[11px] text-red-600 hover:text-red-800 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Retirer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 4 : FINANCES & BOUTON RETIRER (AVEC VALIDATION ADMIN)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "finances" && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-slate-200">
              <h1 className="text-xl font-bold text-[#0B1B3D] font-display">Finances & Demandes de Retrait</h1>
              <p className="text-xs text-slate-500">
                Consultez vos revenus nets et retirez vos fonds vers Mobile Money ou votre compte bancaire
              </p>
            </div>

            {/* Récapitulatif Financier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Solde Retirable
                </span>
                <p className="text-3xl font-black text-emerald-700 mt-1">
                  ${balance ? balance.available.toFixed(2) : "0.00"} USD
                </p>
                <p className="text-[11px] text-emerald-800/80 mt-1">
                  Disponible immédiatement pour retrait
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Ventes Brutes
                </span>
                <p className="text-2xl font-black text-[#0B1B3D] mt-1">
                  ${balance ? balance.totalSales.toFixed(2) : "0.00"} USD
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {balance ? balance.ordersCount : 0} commande(s) payée(s)
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Commissions Plateforme
                </span>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  ${balance ? balance.totalCommission.toFixed(2) : "0.00"} USD
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Frais Mwinda selon forfait ({vendor.plan})
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Fonds Déjà Transférés
                </span>
                <p className="text-2xl font-black text-blue-700 mt-1">
                  ${balance ? balance.withdrawn.toFixed(2) : "0.00"} USD
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Validés par l'administration
                </p>
              </div>
            </div>

            {/* FORMULAIRE DE RETRAIT (AVEC VALIDATION ADMIN) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0B1B3D]">Demander un Retrait de Fonds</h2>
                  <p className="text-xs text-slate-500">
                    Chaque retrait est vérifié et validé par l'administrateur avant transfert effectif
                  </p>
                </div>
              </div>

              {withdrawSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{withdrawSuccessMsg}</span>
                </div>
              )}

              {withdrawErrorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{withdrawErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Montant à retirer ($ USD) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="5"
                        max={balance ? balance.available : undefined}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Ex: 50.00"
                        className="w-full text-xs p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                        required
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">USD</span>
                    </div>
                    {balance && (
                      <p className="text-[11px] text-slate-500">
                        Max retirable : <strong>${balance.available.toFixed(2)} USD</strong>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Moyen de versement *
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="mobile_money">Mobile Money (RDC)</option>
                      <option value="bank">Virement Bancaire (RDC)</option>
                      <option value="cash">Retrait Cash (Agence Mwinda)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      {withdrawMethod === "mobile_money"
                        ? "Opérateur Mobile Money"
                        : "Banque / Agence"}
                    </label>
                    {withdrawMethod === "mobile_money" ? (
                      <select
                        value={withdrawOperator}
                        onChange={(e) => setWithdrawOperator(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="M-Pesa (Vodacom)">M-Pesa (Vodacom)</option>
                        <option value="Airtel Money">Airtel Money</option>
                        <option value="Orange Money">Orange Money</option>
                        <option value="Afrimoney">Afrimoney</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={withdrawOperator}
                        onChange={(e) => setWithdrawOperator(e.target.value)}
                        placeholder="Ex: Rawbank / Equity BCDC"
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Numéro de téléphone bénéficiaire ou Coordonnées IBAN / Compte *
                    </label>
                    <input
                      type="text"
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value)}
                      placeholder="Ex: +243 81 234 5678 (Nom du titulaire : Patrick M.)"
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">info</span>
                  <p>
                    <strong>Processus de sécurité :</strong> Pour protéger votre compte contre toute fraude, chaque demande de retrait apparaît dans le panel de contrôle de l’administrateur Mwinda Market. Dès confirmation, le virement est déclenché vers votre numéro ou compte sous 24h ouvrées.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={withdrawSubmitting || (balance ? balance.available <= 0 : false)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>{withdrawSubmitting ? "Envoi de la demande…" : "Soumettre la demande de retrait"}</span>
                </button>
              </form>
            </div>

            {/* HISTORIQUE DES RETRAITS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#0B1B3D]">Historique de mes demandes de retraits ({withdrawals.length})</h2>

              {withdrawals.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  Aucun retrait demandé pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Montant</th>
                        <th className="text-left p-3">Moyen & Compte</th>
                        <th className="text-left p-3">Statut de validation admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(w.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-3 font-bold text-base text-[#0B1B3D]">
                            ${Number(w.amountUsd).toFixed(2)} USD
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">{w.method}</span>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{w.details || "—"}</div>
                          </td>
                          <td className="p-3">
                            {w.status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                En attente de validation admin
                              </span>
                            )}
                            {w.status === "paid" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Validé & Transféré
                              </span>
                            )}
                            {w.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-xs">cancel</span>
                                Rejeté
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 5 : RÉGLAGES DE LA BOUTIQUE
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 max-w-2xl">
            <div className="pb-3 border-b border-slate-100">
              <h1 className="text-xl font-bold text-[#0B1B3D] font-display">Paramètres & Coordonnées Boutique</h1>
              <p className="text-xs text-slate-500">
                Ces informations sont visibles sur votre vitrine publique pour les acheteurs
              </p>
            </div>

            {settingsMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{settingsMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Nom de la boutique</label>
                <input
                  type="text"
                  value={shopNameEdit}
                  onChange={(e) => setShopNameEdit(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Slogan / Présentation courte</label>
                <input
                  type="text"
                  value={shopTaglineEdit}
                  onChange={(e) => setShopTaglineEdit(e.target.value)}
                  placeholder="Ex: Le spécialiste de la mode et de l'artisanat congolais"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Numéro WhatsApp Commercial</label>
                <input
                  type="tel"
                  value={shopWhatsappEdit}
                  onChange={(e) => setShopWhatsappEdit(e.target.value)}
                  placeholder="+243 81 234 5678"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Adresse physique du magasin / siège</label>
                <input
                  type="text"
                  value={shopAddressEdit}
                  onChange={(e) => setShopAddressEdit(e.target.value)}
                  placeholder="Ex: 14 Av. Kasa-Vubu, Gombe, Kinshasa"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-3 bg-[#0B1B3D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow transition"
              >
                {settingsSaving ? "Enregistrement…" : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
