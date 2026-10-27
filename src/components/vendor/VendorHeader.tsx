"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface VendorHeaderProps {
  shopName: string;
  shopId: string;
  vendorName: string;
  vendorAvatar: string;
  vendorRole: string;
  countryFlag: string;
  countryName: string;
  settlementCurrency: { code: string; symbol: string };
  mobileSidebarOpen: boolean;
  onToggleSidebar: () => void;
  orderSearch: string;
  onOrderSearch: (v: string) => void;
  onShowToast: (msg: string) => void;
  onLockDashboard?: () => void;
}

export function VendorHeader({
  shopName,
  shopId,
  vendorName,
  vendorAvatar,
  vendorRole,
  countryFlag,
  countryName,
  settlementCurrency,
  mobileSidebarOpen,
  onToggleSidebar,
  orderSearch,
  onOrderSearch,
  onShowToast,
  onLockDashboard,
}: VendorHeaderProps) {
  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant z-40 flex-shrink-0 h-16">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand + Shop */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-max">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileSidebarOpen ? "close" : "menu"}
            </span>
          </button>

          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Mwinda Market">
            <Image
              src="/images/logo-mwinda.png"
              alt="Mwinda Market"
              width={36}
              height={36}
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-primary tracking-tight">
                  Mwinda Market
                </span>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px] px-2 py-0.5 rounded-full border border-secondary-fixed-dim uppercase tracking-wider">
                  Vendeur
                </span>
              </div>
            </div>
          </Link>

          <div className="h-6 w-px bg-outline-variant hidden sm:block" />

          <Link
            href={`/boutiques/${shopId}`}
            className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors text-left"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-on-surface leading-tight">
                <span>{shopName}</span>
                <span className="material-symbols-outlined text-sm text-secondary">open_in_new</span>
              </div>
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span>{countryFlag} {countryName}</span> •{" "}
                <span className="text-secondary font-medium font-mono">
                  {settlementCurrency.code} ({settlementCurrency.symbol})
                </span>
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl hidden xl:block">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              placeholder="Rechercher commandes, produits..."
              type="text"
              value={orderSearch}
              onChange={(e) => onOrderSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-max">
          <Link
            href={`/boutiques/${shopId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary-fixed transition-colors font-semibold text-xs"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span className="hidden sm:inline">Ma boutique</span>
          </Link>

          <button
            onClick={() => onShowToast("Messagerie ouverte")}
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            aria-label="Messagerie"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest" />
          </button>

          <button
            onClick={() => onShowToast("5 alertes commandes")}
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 rounded-full bg-[#EA580C] text-white font-bold text-[10px] flex items-center justify-center">
              5
            </span>
          </button>

          {onLockDashboard && (
            <button
              onClick={onLockDashboard}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
              title="Verrouiller le tableau de bord avec code PIN"
              aria-label="Verrouiller"
            >
              <span className="material-symbols-outlined text-xl">lock</span>
            </button>
          )}

          <div className="h-6 w-px bg-outline-variant hidden sm:block" />

          <div className="flex items-center gap-2.5 pl-1">
            <div className="relative">
              <Image
                className="w-9 h-9 rounded-full object-cover border border-outline-variant bg-surface-container-high"
                alt={vendorName}
                src={vendorAvatar}
                width={36}
                height={36}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="font-semibold text-xs text-on-surface leading-tight">{vendorName}</div>
              <div className="text-[11px] text-on-surface-variant font-medium">{vendorRole}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
