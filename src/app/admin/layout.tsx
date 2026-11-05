"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";

const nav = [
  { href: "/admin", label: "Vue Générale", icon: "dashboard" },
  { href: "/admin/commandes", label: "Commandes & Paiements", icon: "shopping_cart" },
  { href: "/admin/catalogue", label: "Catalogue & Produits", icon: "inventory_2" },
  { href: "/admin/vendeurs", label: "Candidatures Vendeurs", icon: "store" },
  { href: "/admin/ventes", label: "Commissions & Ventes", icon: "monitoring" },
  { href: "/admin/retraits", label: "Demandes de Retraits", icon: "account_balance_wallet" },
  { href: "/admin/clients", label: "Utilisateurs & Rôles", icon: "group" },
  { href: "/admin/reglages", label: "Réglages Plateforme", icon: "settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <AdminHeader />
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-surface-container-lowest border-r border-outline-variant p-4 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
              <div className="w-9 h-9 rounded-xl bg-surface p-1 border border-outline-variant shadow-sm flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-mwinda.png"
                  alt="Mwinda Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-primary truncate font-display">Panneau Admin</h2>
                <p className="text-[11px] text-secondary font-bold">Mwinda Market RDC</p>
              </div>
            </div>

            <nav className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    pathname === item.href
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-outline-variant text-xs text-on-surface-variant mt-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-emerald-800">PostgreSQL (Neon) Connecté</span>
            </div>
            <p className="text-[11px] text-outline">Mwinda Admin v1.2 — Transactions Manuelles</p>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
