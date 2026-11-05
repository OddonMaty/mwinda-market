"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface AdminNotification {
  id: string;
  type: "order" | "application" | "withdrawal" | "product";
  title: string;
  description: string;
  time: string;
  href: string;
  priority: "high" | "normal";
}

export function AdminHeader() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "order" | "application" | "withdrawal">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // rafraîchissement auto
    return () => clearInterval(interval);
  }, []);

  // Fermeture clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return { icon: "shopping_bag", color: "text-amber-500 bg-amber-500/10" };
      case "application":
        return { icon: "store", color: "text-blue-500 bg-blue-500/10" };
      case "withdrawal":
        return { icon: "payments", color: "text-emerald-500 bg-emerald-500/10" };
      case "product":
        return { icon: "inventory_2", color: "text-purple-500 bg-purple-500/10" };
      default:
        return { icon: "notifications", color: "text-secondary bg-secondary/10" };
    }
  };

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Logo & Titre */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-surface p-1.5 border border-outline-variant shadow-sm flex items-center justify-center group-hover:scale-105 transition">
            <Image
              src="/images/logo-mwinda.png"
              alt="Mwinda Market Logo"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-primary text-base font-display tracking-tight">
                Mwinda Market
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary text-white">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium">Panneau d'administration sécurisé</p>
          </div>
        </Link>
      </div>

      {/* Barre d'actions droite */}
      <div className="flex items-center gap-3">
        {/* Lien direct boutique public */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-secondary px-3 py-1.5 rounded-lg border border-outline-variant hover:border-secondary transition"
        >
          <span>Voir le site</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </Link>

        {/* Bouton Cloche de Notification avec Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2.5 rounded-xl border border-outline-variant hover:bg-surface-container text-primary transition flex items-center justify-center"
            aria-label="Centre de notifications admin"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Menu déroulant des notifications */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
              <div className="p-3.5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">Notifications en direct</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} action(s)
                    </span>
                  )}
                </div>
                <button
                  onClick={fetchNotifications}
                  className="text-xs text-secondary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Actualiser</span>
                </button>
              </div>

              {/* Filtres rapides */}
              <div className="flex items-center gap-1 p-2 bg-surface border-b border-outline-variant text-[11px] overflow-x-auto">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    filter === "all" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("order")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    filter === "order" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  Ventes & Commandes
                </button>
                <button
                  onClick={() => setFilter("application")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    filter === "application" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  Boutiques
                </button>
                <button
                  onClick={() => setFilter("withdrawal")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    filter === "withdrawal" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  Retraits
                </button>
              </div>

              {/* Liste des notifications */}
              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-1 text-outline">notifications_off</span>
                    <p>Aucune notification correspondante</p>
                  </div>
                ) : (
                  filtered.map((item) => {
                    const iconStyle = getIcon(item.type);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="p-3 flex items-start gap-3 hover:bg-surface-container transition block"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconStyle.color}`}>
                          <span className="material-symbols-outlined text-base">{iconStyle.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-primary truncate">{item.title}</p>
                            <span className="text-[10px] text-outline shrink-0">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Pied de popover */}
              <div className="p-2.5 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-xs">
                <Link
                  href="/admin/commandes"
                  onClick={() => setIsOpen(false)}
                  className="font-bold text-secondary hover:underline"
                >
                  Valider les paiements &rarr;
                </Link>
                <span className="text-[11px] text-outline">Temps réel</span>
              </div>
            </div>
          )}
        </div>

        {/* Badge Statut Système */}
        <div className="flex items-center gap-2 pl-3 border-l border-outline-variant">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}

