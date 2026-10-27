"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { PriceTag } from "@/components/PriceTag";
import { Badge } from "@/components/Badge";
import { CartItem } from "@/context/CartContext";
export interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function CartItemList({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartItemListProps) {

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <h2 className="text-base font-bold text-primary">Articles du panier ({items.length})</h2>
        <button
          type="button"
          onClick={onClearCart}
          className="text-xs text-error font-semibold hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
          <span>Vider le panier</span>
        </button>
      </div>

      <div className="divide-y divide-outline-variant/60">
        {items.map((item) => (
          <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3 sm:gap-4 items-start">
            {/* Image */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/60">
              <Image
                src={item.image || "/images/placeholder-product.png"}
                alt={item.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/produits?q=${encodeURIComponent(item.title)}`}
                  className="text-sm sm:text-base font-bold text-primary hover:text-secondary transition line-clamp-2"
                >
                  {item.title}
                </Link>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-outline hover:text-error transition"
                  title="Supprimer l'article"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {item.shopName && (
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs text-secondary">storefront</span>
                  <span className="font-semibold">{item.shopName}</span>
                </div>
              )}

              {item.badges?.logisticsText && (
                <Badge variant="express" text={item.badges.logisticsText} />
              )}

              {/* Prix & Quantité */}
              <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                <PriceTag usdPrice={item.usdPrice} size="sm" />

                <div className="flex items-center border border-outline-variant rounded-lg bg-surface">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-outline hover:text-primary transition disabled:opacity-30"
                    disabled={item.quantity <= 1}
                    aria-label="Diminuer"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-primary">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-outline hover:text-primary transition"
                    aria-label="Augmenter"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
