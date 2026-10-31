"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes & Paiements" },
  { href: "/admin/vendeurs", label: "Candidatures vendeurs" },
  { href: "/admin/catalogue", label: "Catalogue" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/reglages", label: "Réglages" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="w-64 bg-surface-container border-r border-outline-variant p-4 hidden md:block">
        <h1 className="text-lg font-bold text-primary mb-6">Mwinda Admin</h1>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === item.href
                  ? "bg-secondary-fixed text-on-secondary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
