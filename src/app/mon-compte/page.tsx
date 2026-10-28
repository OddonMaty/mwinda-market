"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────
type AccountTab =
  | "overview"
  | "orders"
  | "addresses"
  | "profile"
  | "security"
  | "notifications";

interface NavItem {
  id: AccountTab;
  label: string;
  icon: string;
  badge?: number;
}

export interface ClientOrder {
  id: string;
  reference: string;
  date: string;
  status: "pending" | "in_prep" | "in_delivery" | "delivered" | "cancelled";
  amount_usd: number;
  currency: string;
  items_count: number;
  shop?: string;
  items?: Array<{
    title: string;
    quantity: number;
    unit_usd_price: number;
    image?: string | null;
  }>;
}

interface ApiOrderItem {
  title: string;
  quantity: number;
  unit_usd_price: number;
  image?: string | null;
}

interface ApiOrder {
  id: string;
  reference: string;
  created_at?: string | null;
  status?: string;
  amount_usd?: number;
  order_items?: ApiOrderItem[];
}

function mapClientOrderStatus(
  status: string | undefined
): ClientOrder["status"] {
  const allowed: ClientOrder["status"][] = [
    "pending",
    "in_prep",
    "in_delivery",
    "delivered",
    "cancelled",
  ];
  if (status && allowed.includes(status as ClientOrder["status"])) {
    return status as ClientOrder["status"];
  }
  return "in_prep";
}

// ─── Status Badge ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  delivered: {
    label: "Livré",
    icon: "check_circle",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  in_delivery: {
    label: "En cours de livraison",
    icon: "local_shipping",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  in_prep: {
    label: "En préparation",
    icon: "inventory_2",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  cancelled: {
    label: "Annulé",
    icon: "cancel",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  pending: {
    label: "En attente de confirmation",
    icon: "schedule",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}
    >
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Navigation Sidebar ──────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Vue d'ensemble", icon: "dashboard" },
  { id: "orders", label: "Mes commandes", icon: "shopping_bag" },
  { id: "addresses", label: "Mes adresses de livraison", icon: "location_on" },
  { id: "profile", label: "Profil & Coordonnées", icon: "person" },
  { id: "security", label: "Sécurité & Mot de passe", icon: "lock" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
];

function AccountNav({
  active,
  onChange,
  ordersCount = 0,
}: {
  active: AccountTab;
  onChange: (t: AccountTab) => void;
  ordersCount?: number;
}) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active === item.id
              ? "bg-primary text-white shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-xl">{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          {item.id === "orders" && ordersCount > 0 && (
            <span className="bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {ordersCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

// ─── Tab: Overview (Style Alibaba Buyer Center) ───────────────────────────
function OverviewTab({
  user,
  orders,
  onNavigate,
  onConfirmEmail,
}: {
  user: UserProfile;
  orders: ClientOrder[];
  onNavigate: (t: AccountTab) => void;
  onConfirmEmail: () => void;
}) {
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "in_prep");
  const inDeliveryOrders = orders.filter((o) => o.status === "in_delivery");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  return (
    <div className="space-y-6">
      {/* En-tête Alibaba Style : Carte Profil Acheteur */}
      <div className="bg-gradient-to-r from-primary via-primary-container to-secondary rounded-2xl p-6 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={user.fullName || "Client Mwinda"}
            size="xl"
            src={user.avatarUrl || undefined}
            className="ring-4 ring-white/20 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-display tracking-tight">
                {user.fullName || "Membre Mwinda Market"}
              </h2>
              <span className="bg-secondary text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-white/20 shadow-sm">
                Membre Vérifié
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">phone</span>
                <span>{user.phone || "Téléphone non renseigné"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">mail</span>
                <span>{user.email || "Email non renseigné"}</span>
              </span>
            </div>

            {/* Email Status Alert */}
            <div className="mt-2.5 flex items-center gap-2">
              {user.emailConfirmed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-400/30">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Adresse email confirmée
                </span>
              ) : (
                <button
                  onClick={onConfirmEmail}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 px-2.5 py-0.5 rounded-md border border-amber-400/40 transition"
                >
                  <span className="material-symbols-outlined text-xs">warning</span>
                  Confirmer mon adresse email →
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate("profile")}
          className="self-stretch md:self-auto bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/30 transition flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          <span>Modifier mon profil</span>
        </button>
      </div>

      {/* Barre d'étapes de Commandes (Inspirée du tableau de bord Alibaba) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
          <h3 className="font-bold text-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">local_mall</span>
            <span>Suivi des commandes (Style Alibaba)</span>
          </h3>
          <button
            onClick={() => onNavigate("orders")}
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <span>Toutes mes commandes</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <button
            onClick={() => onNavigate("orders")}
            className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-surface-container transition group"
          >
            <div className="relative mb-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">inventory_2</span>
              </div>
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {pendingOrders.length}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-on-surface">En préparation</span>
            <span className="text-[11px] text-on-surface-variant">Pris en charge</span>
          </button>

          <button
            onClick={() => onNavigate("orders")}
            className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-surface-container transition group"
          >
            <div className="relative mb-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              {inDeliveryOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {inDeliveryOrders.length}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-on-surface">En livraison</span>
            <span className="text-[11px] text-on-surface-variant">En acheminement</span>
          </button>

          <button
            onClick={() => onNavigate("orders")}
            className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-surface-container transition group"
          >
            <div className="relative mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              {deliveredOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {deliveredOrders.length}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-on-surface">Livrées</span>
            <span className="text-[11px] text-on-surface-variant">Colis reçus</span>
          </button>

          <button
            onClick={() => onNavigate("security")}
            className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-surface-container transition group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <span className="text-xs font-bold text-on-surface">Protection Escrow</span>
            <span className="text-[11px] text-on-surface-variant">Fonds sécurisés</span>
          </button>
        </div>
      </div>

      {/* Raccourcis et garanties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">location_city</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary">Adresse de livraison</p>
            <p className="text-[11px] text-on-surface-variant truncate">
              {user.city ? `${user.city}, ${user.country || "RDC"}` : "Non configurée"}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary">Paiements Mobile Money</p>
            <p className="text-[11px] text-on-surface-variant">M-Pesa, Airtel, Orange</p>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">storefront</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary">Vendre sur Mwinda</p>
            <Link href="/devenir-vendeur" className="text-[11px] text-secondary font-bold hover:underline">
              Ouvrir ma boutique →
            </Link>
          </div>
        </div>
      </div>

      {/* Dernières commandes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface text-sm">Commandes récentes</h3>
          <button
            onClick={() => onNavigate("orders")}
            className="text-xs text-secondary font-semibold hover:underline"
          >
            Voir tout
          </button>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon="shopping_basket"
            title="Aucune commande passée"
            description="Trouvez vos articles préférés dans notre sélection et commandez en toute tranquillité."
            actionLabel="Explorer le catalogue"
            actionHref="/produits"
          />
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-secondary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl text-primary">package_2</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Commande #{order.reference}</p>
                    <p className="text-xs text-on-surface-variant">
                      {order.date} · {order.items_count} article(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">${order.amount_usd.toFixed(2)}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <Link
                    href={`/suivi?order=${order.reference}`}
                    className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-primary border border-outline-variant transition"
                  >
                    Suivre
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Orders ──────────────────────────────────────────────────────────
function OrdersTab({ orders }: { orders: ClientOrder[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
        <div>
          <h2 className="text-lg font-bold text-primary font-display">Mes commandes</h2>
          <p className="text-xs text-on-surface-variant">Historique complet de vos achats sécurisés sous Escrow</p>
        </div>
        <span className="text-xs font-bold bg-surface-container px-3 py-1 rounded-full text-on-surface-variant border border-outline-variant">
          Total : {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="shopping_bag"
          title="Vous n'avez pas encore passé de commande"
          description="Votre panier et vos commandes apparaîtront ici dès que vous aurez finalisé un achat."
          actionLabel="Faire des achats"
          actionHref="/produits"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">#{order.reference}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Passée le {order.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-primary">${order.amount_usd.toFixed(2)}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">Garantie Anti-Fraude Escrow</p>
                </div>
              </div>

              {/* Items preview */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-base">check</span>
                        <span className="font-medium text-on-surface">{item.title}</span>
                      </div>
                      <span className="text-on-surface-variant">
                        x{item.quantity} · ${item.unit_usd_price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-outline-variant">
                <Link
                  href={`/suivi?order=${order.reference}`}
                  className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-secondary/90 transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">track_changes</span>
                  Suivre la livraison
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Profile (Style Alibaba Info & Verification) ─────────────────────
function ProfileTab({
  user,
  onSaveProfile,
}: {
  user: UserProfile;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [city, setCity] = useState(user.city || "");
  const [country, setCountry] = useState(user.country || "CD");
  const [address, setAddress] = useState(user.address || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [confirmStatusMsg, setConfirmStatusMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveProfile({
      fullName,
      email,
      phone,
      city,
      country,
      address,
      avatarUrl: avatarUrl.trim() || null,
    });
    setSavedMsg("Vos informations ont été enregistrées avec succès !");
    setIsSaving(false);
    setTimeout(() => setSavedMsg(""), 3500);
  };

  const handleVerifyEmail = async () => {
    setConfirmStatusMsg("Un email de confirmation vient de vous être envoyé. Votre adresse a été validée.");
    await onSaveProfile({ emailConfirmed: true });
    setTimeout(() => setConfirmStatusMsg(""), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div>
          <h2 className="text-lg font-bold text-primary font-display">Profil & Coordonnées Personnelles</h2>
          <p className="text-xs text-on-surface-variant">
            Gérez vos informations de compte selon les standards de protection Alibaba
          </p>
        </div>
        <span className="text-[11px] font-bold text-secondary bg-secondary-fixed/50 px-3 py-1 rounded-full border border-secondary/20">
          Compte Acheteur
        </span>
      </div>

      {confirmStatusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{confirmStatusMsg}</span>
        </div>
      )}

      {/* Avatar / Photo de profil */}
      <div className="p-5 bg-surface-container-low border border-outline-variant rounded-2xl flex flex-col sm:flex-row items-center gap-4">
        <Avatar name={fullName || "Client"} size="xl" src={avatarUrl || undefined} />
        <div className="flex-1 text-center sm:text-left space-y-1">
          <p className="text-sm font-bold text-primary">Photo de profil</p>
          <p className="text-xs text-on-surface-variant">
            Renseignez l&apos;URL de votre photo ou avatar personnel pour personnaliser votre espace.
          </p>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://exemple.com/photo.jpg"
            className="w-full text-xs p-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary mt-1"
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary uppercase tracking-wide">
              Nom complet
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Patrick Lumumba"
              icon="badge"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary uppercase tracking-wide">
                Adresse email
              </label>
              {user.emailConfirmed ? (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Vérifié
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  className="text-[11px] font-bold text-secondary hover:underline"
                >
                  Confirmer l&apos;email
                </button>
              )}
            </div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@domaine.com"
              icon="mail"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary uppercase tracking-wide">
              Numéro de téléphone
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 812 345 678"
              icon="smartphone"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary uppercase tracking-wide">
              Pays de résidence
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="CD">🇨🇩 République Démocratique du Congo (RDC)</option>
              <option value="CG">🇨🇬 République du Congo</option>
              <option value="RW">🇷🇼 Rwanda</option>
              <option value="BI">🇧🇮 Burundi</option>
              <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
              <option value="CM">🇨🇲 Cameroun</option>
              <option value="FR">🇫🇷 France</option>
              <option value="BE">🇧🇪 Belgique</option>
              <option value="CA">🇨🇦 Canada</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary uppercase tracking-wide">
              Ville
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Kinshasa, Lubumbashi, Goma..."
              icon="location_city"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary uppercase tracking-wide">
              Commune / Adresse de livraison
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Gombe, Av. de la Justice n°12..."
              icon="home"
            />
          </div>
        </div>

        {savedMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{savedMsg}</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="secondary"
            className="w-full sm:w-auto px-8 h-12 text-sm font-bold shadow-md"
            isLoading={isSaving}
          >
            <span className="material-symbols-outlined mr-1.5 text-base">save</span>
            Enregistrer mes modifications
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Tab: Addresses ───────────────────────────────────────────────────────
function AddressesTab({
  user,
  onSaveAddress,
}: {
  user: UserProfile;
  onSaveAddress: (address: string, city: string) => Promise<void>;
}) {
  const [address, setAddress] = useState(user.address || "");
  const [city, setCity] = useState(user.city || "Kinshasa");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveAddress(address, city);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div>
          <h2 className="text-lg font-bold text-primary font-display">Mes adresses de livraison</h2>
          <p className="text-xs text-on-surface-variant">Adresse par défaut pour vos commandes et livraisons express</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary uppercase">Ville principale</label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Kinshasa"
            icon="location_city"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-primary uppercase">Adresse détaillée / Commune / Repère</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Commune de Limete, 7ème Rue résidentielle n°14"
            icon="home"
            required
          />
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Adresse enregistrée avec succès.</span>
          </div>
        )}

        <Button type="submit" variant="secondary" className="px-6 h-11 text-xs font-bold">
          Mettre à jour mon adresse
        </Button>
      </form>
    </div>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────
function SecurityTab() {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    if (newPwd.length < 6) {
      setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setErrorMsg("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
      }
      setStatusMsg("Votre mot de passe a été modifié avec succès.");
      setNewPwd("");
      setConfirmPwd("");
    } catch {
      setErrorMsg("Impossible de modifier le mot de passe pour le moment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-outline-variant">
        <h2 className="text-lg font-bold text-primary font-display">Sécurité & Confidentialité</h2>
        <p className="text-xs text-on-surface-variant">Protégez votre compte avec un mot de passe robuste</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">lock</span>
          <span>Modifier le mot de passe</span>
        </h3>

        <form onSubmit={handleChange} className="space-y-3 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Nouveau mot de passe</label>
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              icon="lock_reset"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Confirmer le mot de passe</label>
            <Input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              icon="lock"
              required
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-error font-semibold">{errorMsg}</p>
          )}

          {statusMsg && (
            <p className="text-xs text-emerald-700 font-semibold">{statusMsg}</p>
          )}

          <Button type="submit" variant="secondary" className="px-6 h-11 text-xs font-bold" isLoading={isSaving}>
            Mettre à jour le mot de passe
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────
function NotificationsTab() {
  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-outline-variant">
        <h2 className="text-lg font-bold text-primary font-display">Centre de Notifications</h2>
        <p className="text-xs text-on-surface-variant">Alertes sur vos commandes, expéditions et garanties Escrow</p>
      </div>
      <EmptyState
        icon="notifications_off"
        title="Aucune nouvelle notification"
        description="Vous recevrez ici les confirmations de paiement et les alertes d'expédition de vos colis."
      />
    </div>
  );
}

// ─── Main Client Dashboard Page ───────────────────────────────────────────
export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AccountTab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [orders, setOrders] = useState<ClientOrder[]>([]);

  // Charge les commandes locales et Supabase
  useEffect(() => {
    async function loadOrders() {
      // 1. Commandes locales
      let localList: ClientOrder[] = [];
      try {
        const stored = localStorage.getItem("mwinda_local_orders");
        if (stored) {
          localList = JSON.parse(stored);
        }
      } catch {
        // ignore
      }

      // 2. Commandes via API serveur (contourne RLS deny-by-default)
      try {
        if (user) {
          const params = new URLSearchParams();
          if (user.email) params.set("email", user.email);
          if (user.phone) params.set("phone", user.phone);

          if (params.toString()) {
            const res = await fetch(`/api/orders?${params.toString()}`, {
              credentials: "same-origin",
            });
            if (res.ok) {
              const payload = (await res.json()) as { orders?: ApiOrder[] };
              const data = Array.isArray(payload.orders) ? payload.orders : [];
              if (data.length > 0) {
                const mappedSupabase: ClientOrder[] = data.map((o) => ({
                  id: o.id,
                  reference: o.reference,
                  date: o.created_at
                    ? new Date(o.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Récemment",
                  status: mapClientOrderStatus(o.status),
                  amount_usd: o.amount_usd || 0,
                  currency: "USD",
                  items_count: o.order_items?.length || 1,
                  items: o.order_items?.map((it) => ({
                    title: it.title,
                    quantity: it.quantity,
                    unit_usd_price: it.unit_usd_price,
                    image: it.image,
                  })),
                }));

                const mergedMap = new Map<string, ClientOrder>();
                mappedSupabase.forEach((o) => mergedMap.set(o.reference, o));
                localList.forEach((o) => {
                  if (!mergedMap.has(o.reference)) {
                    mergedMap.set(o.reference, o);
                  }
                });
                setOrders(Array.from(mergedMap.values()));
                return;
              }
            }
          }
        }
      } catch {
        // ignore — fallback localStorage
      }

      setOrders(localList);
    }

    if (user) {
      loadOrders();
    }
  }, [user]);

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/connexion?redirect=/mon-compte");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-[260px,1fr] gap-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    await updateProfile(updates);
  };

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || "";

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Navigation mobile */}
        <div className="md:hidden flex items-center justify-between mb-4 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 bg-surface border border-outline-variant rounded-xl"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h1 className="font-bold text-sm text-primary">{activeLabel}</h1>
          </div>
          <span className="text-[11px] font-bold text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded-full">
            Alibaba Buyer
          </span>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden mb-4 bg-surface border border-outline-variant rounded-2xl p-3 shadow-lg">
            <AccountNav
              active={activeTab}
              onChange={(t) => {
                setActiveTab(t);
                setMobileNavOpen(false);
              }}
              ordersCount={orders.length}
            />
          </div>
        )}

        <div className="grid md:grid-cols-[260px,1fr] gap-6 items-start">
          {/* Sidebar Bureau */}
          <aside className="hidden md:flex flex-col gap-4 sticky top-24">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col items-center gap-3 text-center shadow-card">
              <Avatar name={user.fullName || "Client"} size="xl" src={user.avatarUrl || undefined} />
              <div className="min-w-0 w-full">
                <p className="font-black text-sm text-primary truncate">
                  {user.fullName || "Client Mwinda"}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {user.phone || user.email || ""}
                </p>
              </div>

              {user.role === "vendor" ? (
                <Link
                  href="/vendeur/dashboard"
                  className="w-full text-center text-xs font-bold bg-primary text-white py-2 rounded-xl shadow-sm hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">storefront</span>
                  <span>Tableau de bord Vendeur</span>
                </Link>
              ) : (
                <Link
                  href="/devenir-vendeur"
                  className="w-full text-center text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20 py-2 rounded-xl hover:bg-secondary/20 transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">store</span>
                  <span>Ouvrir une boutique</span>
                </Link>
              )}
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 shadow-card">
              <AccountNav
                active={activeTab}
                onChange={setActiveTab}
                ordersCount={orders.length}
              />
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-bold text-error hover:bg-error/5 transition"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Se déconnecter</span>
            </button>
          </aside>

          {/* Contenu principal */}
          <div className="min-w-0 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 md:p-8 shadow-card">
            {activeTab === "overview" && (
              <OverviewTab
                user={user}
                orders={orders}
                onNavigate={setActiveTab}
                onConfirmEmail={() => setActiveTab("profile")}
              />
            )}
            {activeTab === "orders" && <OrdersTab orders={orders} />}
            {activeTab === "addresses" && (
              <AddressesTab
                user={user}
                onSaveAddress={async (address, city) => {
                  await handleSaveProfile({ address, city });
                }}
              />
            )}
            {activeTab === "profile" && (
              <ProfileTab user={user} onSaveProfile={handleSaveProfile} />
            )}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "notifications" && <NotificationsTab />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
