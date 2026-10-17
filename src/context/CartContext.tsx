"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMarket } from "@/context/MarketContext";

export interface CartItem {
  id: string;
  title: string;
  image: string;
  usdPrice: number;
  originalUsdPrice?: number;
  shopName: string;
  shopCity?: string;
  province?: string;
  quantity: number;
  badges?: {
    discount?: string;
    logistics?: "express" | "interprovincial" | "essential" | "top-sale" | "origin-rdc";
    logisticsText?: string;
  };
}

export type CartProductInput = Omit<CartItem, "quantity">;

interface CartContextType {
  items: CartItem[];
  addToCart: (product: CartProductInput, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotalUsd: number;
  /** Code pays du panier courant */
  cartCountryCode: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Clé localStorage unique et globale pour le panier panafricain */
const CART_STORAGE_KEY = "mwinda_cart";

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { country } = useMarket();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Chargement et migration au premier montage
  useEffect(() => {
    try {
      let initialItems: CartItem[] = [];
      const savedUnified = localStorage.getItem(CART_STORAGE_KEY);
      if (savedUnified) {
        try {
          const parsed = JSON.parse(savedUnified);
          if (Array.isArray(parsed)) {
            initialItems = parsed;
          }
        } catch {
          // ignore json parse error
        }
      }

      // Migration des anciennes clés par pays : mwinda_cart_CD, mwinda_cart_KE, etc.
      const keysToMigrate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("mwinda_cart_") && k !== CART_STORAGE_KEY) {
          keysToMigrate.push(k);
        }
      }

      if (keysToMigrate.length > 0) {
        const mergedMap = new Map<string, CartItem>();
        for (const it of initialItems) {
          mergedMap.set(it.id, { ...it });
        }

        for (const key of keysToMigrate) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                for (const it of parsed) {
                  if (it && it.id) {
                    if (mergedMap.has(it.id)) {
                      const exist = mergedMap.get(it.id)!;
                      exist.quantity = (exist.quantity || 1) + (it.quantity || 1);
                    } else {
                      mergedMap.set(it.id, { ...it });
                    }
                  }
                }
              }
            }
          } catch {
            // ignore
          }
          // Suppression de l'ancienne clé spécifique au pays
          localStorage.removeItem(key);
        }

        initialItems = Array.from(mergedMap.values());
      }

      setItems(initialItems);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(initialItems));
    } catch {
      setItems([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sauvegarde persistante dès modification
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isLoaded]);

  const addToCart = (product: CartProductInput, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          image: product.image,
          usdPrice: product.usdPrice,
          originalUsdPrice: product.originalUsdPrice,
          shopName: product.shopName,
          shopCity: product.shopCity,
          province: product.province || "",
          quantity,
          badges: product.badges,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalUsd = items.reduce((acc, item) => acc + item.usdPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotalUsd,
        cartCountryCode: country.code,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Fallback sécurisé hors CartProvider (ne devrait pas arriver)
    return {
      items: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      totalCount: 0,
      subtotalUsd: 0,
      cartCountryCode: "CD",
    };
  }
  return context;
};
