"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PinGate } from "@/components/vendor/PinGate";
import { VendorHeader } from "@/components/vendor/VendorHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  VENDOR_STATS,
  VENDOR_RECENT_ORDERS,
  VENDOR_STOCK_ALERTS,
  VENDOR_PRODUCTS,
  VENDOR_PROFILE,
  VendorOrder,
  VendorProduct,
  getPayoutConfigForCountry,
} from "@/data/vendor";

// ─── Types ────────────────────────────────────────────────────────────────
type TabType = "dashboard" | "products" | "orders" | "customers" | "settings";

// ─── Status Badge ─────────────────────────────────────────────────────────
const ORDER_STATUS_CONFIG = {
  in_delivery: { label: "En livraison", icon: "local_shipping", className: "bg-blue-100 text-blue-700 border-blue-200" },
  shipped_hub: { label: "Hub régional", icon: "warehouse", className: "bg-purple-100 text-purple-700 border-purple-200" },
  delivered: { label: "Livré", icon: "check_circle", className: "bg-green-100 text-green-700 border-green-200" },
  in_prep: { label: "En préparation", icon: "inventory_2", className: "bg-amber-100 text-amber-700 border-amber-200" },
  pending: { label: "En attente", icon: "schedule", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

function StatusBadge({ status }: { status: keyof typeof ORDER_STATUS_CONFIG }) {
  const cfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard" as TabType, label: "Tableau de bord", icon: "dashboard" },
  { id: "products" as TabType, label: "Produits", icon: "inventory_2" },
  { id: "orders" as TabType, label: "Commandes", icon: "shopping_bag" },
  { id: "customers" as TabType, label: "Clients", icon: "people" },
  { id: "settings" as TabType, label: "Paramètres", icon: "settings" },
];

function VendorSidebar({
  active,
  onChange,
  mobileSidebarOpen,
  onClose,
  profile,
}: {
  active: TabType;
  onChange: (t: TabType) => void;
  mobileSidebarOpen: boolean;
  onClose: () => void;
  profile: typeof VENDOR_PROFILE;
}) {
  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface-container-lowest border-r border-outline-variant flex-shrink-0 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
        mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Hub badge */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
            <span className="material-symbols-outlined text-lg">hub</span>
          </div>
          <div className="overflow-hidden">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Hub Principal</div>
            <div className="text-xs text-primary truncate font-bold">{profile.hubLocation}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          <div className="px-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">Commerce</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onChange(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === item.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom: plan badge */}
      <div className="p-4 border-t border-outline-variant">
        <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 rounded-xl p-3">
          <p className="text-xs font-bold text-secondary">Offre Premium</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">Commission: 2% · ∞ Produits</p>
          <Link href="/devenir-vendeur" className="text-[10px] text-secondary hover:underline font-semibold">
            Voir les offres →
          </Link>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard Overview Tab ───────────────────────────────────────────────
function DashboardOverview({
  timeRange,
  onTimeRange,
}: {
  timeRange: string;
  onTimeRange: (v: "7J" | "30J" | "3M" | "1AN") => void;
}) {
  return (
    <div className="space-y-6">
      {/* En-tête et sélecteur de période */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-primary font-display">Vue d&apos;ensemble de votre activité</h2>
          <p className="text-xs text-on-surface-variant">Statistiques calculées à partir de vos commandes réelles</p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(["7J", "30J", "3M", "1AN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeRange === r ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — indicateurs réels initialisés */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Ventes Totales", value: "$0.00", sub: "Aucune vente sur la période", icon: "payments", color: "text-emerald-600" },
          { label: "Commandes reçues", value: "0", sub: "En attente de clients", icon: "shopping_bag", color: "text-blue-600" },
          { label: "Produits au catalogue", value: "0", sub: "Ajoutez vos articles", icon: "inventory_2", color: "text-amber-600" },
          { label: "Clients uniques", value: "0", sub: "Nouveau compte vendeur", icon: "people", color: "text-purple-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-outline-variant rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className={`material-symbols-outlined text-2xl ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Actif</span>
            </div>
            <p className="text-2xl font-black text-on-surface font-display">{kpi.value}</p>
            <div>
              <p className="text-xs font-bold text-primary">{kpi.label}</p>
              <p className="text-[11px] text-on-surface-variant">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* État de démarrage pour nouvelle boutique */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">inventory_2</span>
            <h3 className="font-bold text-sm text-primary">Articles de votre boutique</h3>
          </div>
          <EmptyState
            icon="post_add"
            title="Aucun produit en ligne pour l'instant"
            description="Votre catalogue est prêt à accueillir vos premiers articles dès la validation de votre forfait."
          />
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">local_shipping</span>
            <h3 className="font-bold text-sm text-primary">Commandes récentes</h3>
          </div>
          <EmptyState
            icon="receipt_long"
            title="Aucune commande enregistrée"
            description="Dès qu'un client passera commande via Mwinda Market, les détails apparaîtront ici en direct."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────
function ProductsTab({
  products,
  onToggle,
  search,
  onSearch,
}: {
  products: VendorProduct[];
  onToggle: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Rechercher un produit..."
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-semibold hover:bg-secondary/90 transition">
          <span className="material-symbols-outlined text-base">add</span>
          Ajouter
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="inventory_2" title="Aucun produit" description="Vous n'avez pas encore de produits correspondants." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-surface border border-outline-variant rounded-2xl overflow-hidden group hover:border-secondary/50 transition">
              <div className="h-32 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">image</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.category} · SKU: {p.sku}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    p.status === "active" ? "bg-green-100 text-green-700 border-green-200" :
                    p.status === "low_stock" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    p.status === "out_of_stock" ? "bg-red-100 text-red-700 border-red-200" :
                    "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    {p.status === "active" ? "Actif" : p.status === "low_stock" ? "Stock bas" : p.status === "out_of_stock" ? "Épuisé" : "Désactivé"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm font-bold text-primary">${p.priceUsd}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggle(p.id)}
                      className="p-1.5 rounded-lg hover:bg-surface-container transition text-on-surface-variant hover:text-primary"
                      title={p.status === "disabled" ? "Activer" : "Désactiver"}
                    >
                      <span className="material-symbols-outlined text-base">{p.status === "disabled" ? "visibility" : "visibility_off"}</span>
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-surface-container transition text-on-surface-variant hover:text-secondary">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────
function OrdersTab({
  orders,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  onCopy,
}: {
  orders: VendorOrder[];
  search: string;
  onSearch: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  onCopy: (ref: string) => void;
}) {
  const filtered = orders.filter((o) => {
    const matchSearch =
      o.reference.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Rechercher commandes..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="py-2 px-3 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          <option value="all">Tous les statuts</option>
          <option value="in_prep">En préparation</option>
          <option value="in_delivery">En livraison</option>
          <option value="shipped_hub">Hub régional</option>
          <option value="delivered">Livré</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="shopping_bag" title="Aucune commande" description="Aucune commande ne correspond à vos critères." />
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary">{order.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold">{order.reference}</p>
                  <button onClick={() => onCopy(order.reference)} className="text-on-surface-variant hover:text-secondary">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant">{order.customerName} · {order.destination}</p>
                <p className="text-xs text-on-surface-variant">{order.itemsSummary}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold">${order.amountUsd}</p>
                  <p className="text-xs text-on-surface-variant">{order.date}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────
function SettingsTab({
  profile,
  onUpdatePin,
  onShowToast,
}: {
  profile: typeof VENDOR_PROFILE;
  onUpdatePin: (pin: string) => void;
  onShowToast: (msg: string) => void;
}) {
  const payoutConfig = getPayoutConfigForCountry(profile.countryCode);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!/^\d{4}$/.test(newPin)) {
      setPinError("Le code PIN doit être composé exactement de 4 chiffres.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("Les deux codes PIN ne correspondent pas.");
      return;
    }

    onUpdatePin(newPin);
    onShowToast("Code PIN d'accès mis à jour avec succès !");
    setIsChangingPin(false);
    setNewPin("");
    setConfirmPin("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-primary font-display">Paramètres de la boutique</h2>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm border-b border-outline-variant pb-2">Informations boutique</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant font-bold uppercase">Nom de la boutique</label>
            <input defaultValue={profile.shopName} className="mt-1 w-full py-2 px-3 bg-surface-container border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-bold uppercase">Téléphone</label>
            <input defaultValue={profile.phone} className="mt-1 w-full py-2 px-3 bg-surface-container border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-bold uppercase">Pays</label>
            <p className="mt-1 py-2 px-3 bg-surface-container border border-outline-variant rounded-xl text-sm">
              {profile.countryFlag} {profile.countryName}
            </p>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-bold uppercase">Devise de règlement</label>
            <p className="mt-1 py-2 px-3 bg-surface-container border border-outline-variant rounded-xl text-sm font-mono">
              {profile.settlementCurrency.code} ({profile.settlementCurrency.symbol})
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm border-b border-outline-variant pb-2">Modes de paiement disponibles</h3>
        <div className="space-y-2">
          {payoutConfig.mobileMoneyOperators.map((op) => (
            <div key={op} className="flex items-center gap-2 p-2 bg-surface-container rounded-lg text-xs">
              <span className="material-symbols-outlined text-base text-secondary">
                {op.includes("bancaire") ? "account_balance" : "smartphone"}
              </span>
              {op}
            </div>
          ))}
        </div>
      </div>

      {/* PIN change section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm border-b border-outline-variant pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-secondary">lock</span>
            <span>Code d&apos;accès sécurisé (PIN à 4 chiffres)</span>
          </span>
          <span className="text-[11px] font-mono bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant">
            PIN Actuel : ••••
          </span>
        </h3>
        <p className="text-xs text-on-surface-variant">
          Vos informations financières et vos commandes vendeurs sont protégées par ce code d&apos;accès.
        </p>

        {isChangingPin ? (
          <form onSubmit={handleSavePin} className="space-y-3 max-w-sm pt-2">
            <div>
              <label className="text-xs font-bold text-primary">Nouveau code PIN (4 chiffres)</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 5821"
                className="w-full mt-1 p-2 bg-surface border border-outline-variant rounded-xl text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-primary">Confirmer le nouveau code PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full mt-1 p-2 bg-surface border border-outline-variant rounded-xl text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-error">{pinError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition shadow-sm"
              >
                Enregistrer le nouveau PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setPinError("");
                }}
                className="px-3 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsChangingPin(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">key</span>
            <span>Changer mon code d&apos;accès PIN</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────
export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [pin, setPin] = useState("1234");
  const [pinPassed, setPinPassed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7J" | "30J" | "3M" | "1AN">("30J");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [products, setProducts] = useState<VendorProduct[]>(VENDOR_PRODUCTS);
  const [productSearch, setProductSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [vendorReg, setVendorReg] = useState<{
    shopName?: string;
    category?: string;
    city?: string;
    phone?: string;
    planName?: string;
  } | null>(null);

  // Charger le PIN personnalisé et les données d'inscription boutique
  useEffect(() => {
    try {
      const storedPin = localStorage.getItem("mwinda_vendor_pin");
      if (storedPin) {
        setPin(storedPin);
      }
      const storedReg = localStorage.getItem("mwinda_vendor_registration");
      if (storedReg) {
        setVendorReg(JSON.parse(storedReg));
      }
    } catch {
      // ignore
    }
  }, []);

  // Profil vendeur calculé à partir de l'utilisateur connecté et de sa boutique inscrite
  const dynamicProfile = {
    ...VENDOR_PROFILE,
    name: user?.fullName || user?.email?.split("@")[0] || "Vendeur Partenaire",
    shopName: vendorReg?.shopName || user?.fullName ? `${vendorReg?.shopName || "Boutique de " + (user?.fullName || "Vendeur")}` : VENDOR_PROFILE.shopName,
    hubLocation: `${vendorReg?.city || user?.city || "Kinshasa"} (RDC)`,
    phone: vendorReg?.phone || user?.phone || VENDOR_PROFILE.phone,
    countryCode: user?.country || "CD",
    countryName: "RD Congo",
    countryFlag: "🇨🇩",
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/connexion?redirect=/vendeur/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleProductStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, status: p.status === "disabled" ? "active" : "disabled" };
        }
        return p;
      })
    );
    showToast("Statut du produit mis à jour");
  };

  const handleUpdatePin = (newPin: string) => {
    setPin(newPin);
    try {
      localStorage.setItem("mwinda_vendor_pin", newPin);
    } catch {
      // ignore
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-16 border-b border-outline-variant bg-surface-container-lowest" />
        <div className="flex-1 flex">
          <div className="w-64 border-r border-outline-variant p-4 space-y-2 hidden md:block">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // PIN Gate - shown before dashboard access
  if (!pinPassed) {
    return (
      <PinGate
        correctPin={pin}
        onSuccess={() => setPinPassed(true)}
        shopName={dynamicProfile.shopName}
        vendorName={dynamicProfile.name}
      />
    );
  }

  const tabTitle: Record<TabType, string> = {
    dashboard: "Tableau de bord",
    products: "Produits",
    orders: "Commandes",
    customers: "Clients",
    settings: "Paramètres",
  };

  return (
    <div className="h-screen flex flex-col bg-surface text-on-surface font-sans overflow-hidden antialiased">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-white px-5 py-3.5 rounded-xl shadow-2xl border border-secondary-fixed flex items-center gap-3 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-xl">check_circle</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <VendorHeader
        shopName={dynamicProfile.shopName}
        shopId={dynamicProfile.shopId}
        vendorName={dynamicProfile.name}
        vendorAvatar={dynamicProfile.avatarUrl}
        vendorRole={dynamicProfile.role}
        countryFlag={dynamicProfile.countryFlag}
        countryName={dynamicProfile.countryName}
        settlementCurrency={dynamicProfile.settlementCurrency}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        orderSearch={orderSearch}
        onOrderSearch={setOrderSearch}
        onShowToast={showToast}
        onLockDashboard={() => {
          setPinPassed(false);
          showToast("Tableau de bord verrouillé");
        }}
      />

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <VendorSidebar
          active={activeTab}
          onChange={setActiveTab}
          mobileSidebarOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          profile={dynamicProfile}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Page header */}
          <div className="sticky top-0 z-10 bg-surface-container-lowest border-b border-outline-variant px-6 py-4 flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-base font-bold text-on-surface">{tabTitle[activeTab]}</h1>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "dashboard" && (
              <DashboardOverview timeRange={timeRange} onTimeRange={setTimeRange} />
            )}
            {activeTab === "products" && (
              <ProductsTab
                products={products}
                onToggle={toggleProductStatus}
                search={productSearch}
                onSearch={setProductSearch}
              />
            )}
            {activeTab === "orders" && (
              <OrdersTab
                orders={VENDOR_RECENT_ORDERS}
                search={orderSearch}
                onSearch={setOrderSearch}
                statusFilter={orderStatusFilter}
                onStatusFilter={setOrderStatusFilter}
                onCopy={(ref) => {
                  navigator.clipboard?.writeText(ref);
                  showToast(`Référence ${ref} copiée`);
                }}
              />
            )}
            {activeTab === "customers" && (
              <EmptyState
                icon="people"
                title="Gestion des clients"
                description="La vue détaillée des clients sera disponible prochainement."
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                profile={dynamicProfile}
                onUpdatePin={handleUpdatePin}
                onShowToast={showToast}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
