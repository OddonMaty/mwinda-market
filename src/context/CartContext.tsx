"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

/** Clé localStorage par pays : mwinda_cart_CD, mwinda_cart_KE, etc. */
function getStorageKey(countryCode: string): string {
  return `mwinda_cart_${(countryCode || "CD").toUpperCase()}`;
}

/** Articles de démo pour la RDC (affichés quand le panier CD est vide) */
const RDC_DEMO_ITEMS: CartItem[] = [
  {
    id: "station-energie-solaire-1000w",
    title: "Station d'Énergie Solaire Portable 1000W / 220V",
    shopName: "Solaris RDC",
    shopCity: "Matadi",
    province: "Kongo Central",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmXvfXwTplOwxgiJSx77S7jwTTpZ8JC6jwsJkDBxGUAuYb2ISq2w7Dd5KmxiP3VGTqPnQaFJ-XvGGOH4t-BOxDhG_bz6OGLB74m-ihjwpe6I7hvGgxva8brMHKPYTDz6dmidEFXg9OPv14a2nNr_DDXYoPt05RR8OLvBb4dnSgsMvKAgzE4-yJgSKDqVyj1zeKvHxzAq9GB1TKlLWtph7tDGM5vjkclHkTieQNFPxfadZthzHrkJ3x",
    usdPrice: 640,
    originalUsdPrice: 720,
    quantity: 1,
    badges: {
      discount: "Top Vente",
      logistics: "interprovincial",
      logisticsText: "Solaire RDC",
    },
  },
  {
    id: "ecouteurs-sans-fil-pro-anc",
    title: "Écouteurs Sans Fil Pro Anti-Bruit ANC 35h",
    shopName: "Kin Bourse High-Tech",
    shopCity: "Kinshasa (Limete)",
    province: "Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVXnkcQ9M4ypR_WjnwEz9_U_keYyPiyWC3xYO_Cq_Ng8pO-2a4eotSrSwuWVOsd2PRPH-BWfGpexGuit0Md_7IQUJtyYkOORHl2ErrO-CGKwuvBhx5Rv9KYd8CFipKpZwzP8Jl1zVPnSs3wqQUGcTlKTEMJ6PkhAd83wXC_o634LHX63K74ySxRBseoEUy8qohH5LlOuiDkXPJfI3J5HKnoPc2jRTu_3iKhTQ7vjlk5BhybEduYcQb",
    usdPrice: 45,
    originalUsdPrice: 65,
    quantity: 2,
    badges: {
      discount: "-30%",
      logistics: "express",
      logisticsText: "Stock Local",
    },
  },
];

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Obtenir le pays courant depuis MarketContext
  const { country } = useMarket();
  const countryCode = country.code;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedForCountry, setLoadedForCountry] = useState<string>("");

  // Charger le panier du pays courant depuis localStorage
  const loadCartForCountry = useCallback((code: string) => {
    try {
      const key = getStorageKey(code);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      }
      // Panier vide en localStorage : utiliser les articles démo pour la RDC
      if (code === "CD") {
        setItems(RDC_DEMO_ITEMS);
      } else {
        setItems([]);
      }
    } catch {
      // Ignorer les erreurs localStorage (SSR ou mode privé)
      if (code === "CD") {
        setItems(RDC_DEMO_ITEMS);
      } else {
        setItems([]);
      }
    }
  }, []);

  // Lors du premier chargement ou changement de pays
  useEffect(() => {
    if (!countryCode) return;
    if (countryCode !== loadedForCountry) {
      loadCartForCountry(countryCode);
      setLoadedForCountry(countryCode);
      setIsLoaded(true);
    }
  }, [countryCode, loadedForCountry, loadCartForCountry]);

  // Sauvegarder le panier courant dans localStorage (clé par pays)
  useEffect(() => {
    if (!isLoaded || !countryCode) return;
    try {
      const key = getStorageKey(countryCode);
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // Ignorer
    }
  }, [items, isLoaded, countryCode]);

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
        cartCountryCode: countryCode,
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
      items: RDC_DEMO_ITEMS,
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      totalCount: 3,
      subtotalUsd: 730,
      cartCountryCode: "CD",
    };
  }
  return context;
};
