"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Shop } from "@/data/shops";
import { ElectronicProduct } from "@/data/electronics";

interface CatalogContextType {
  shops: Shop[];
  products: ElectronicProduct[];
  isLive: boolean;
  isLoading: boolean;
  getShopById: (id: string) => Shop | undefined;
  getProductById: (id: string) => ElectronicProduct | undefined;
  getProductsByShop: (shopId: string) => ElectronicProduct[];
  getAllProductProvinces: () => string[];
  getAllShopNames: () => string[];
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Démarrer avec des tableaux vides — NE PAS charger les données mock offline
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<ElectronicProduct[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/catalog");
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const data = await res.json();

        if (data.products && data.products.length > 0) {
          // Mapper vers les types attendus par l'UI existante (minimal)
          const mappedProducts: ElectronicProduct[] = data.products.map((p: any) => ({
            id: p.id,
            shopId: p.shopId,
            title: p.title,
            shopName: p.shopName,
            image: p.image,
            images: p.images?.length ? p.images : (p.image ? [p.image] : []),
            usdPrice: p.usdPrice,
            rating: p.rating || 4.5,
            reviewCount: p.reviewCount || 0,
            category: p.category || "Général",
            province: p.province || "Kinshasa",
            inStock: p.inStock,
            stockCount: p.stockCount,
            description: p.description || "",
            features: [],
            specifications: {},
            badges: {},
          }));

          const mappedShops: Shop[] = (data.shops || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            tagline: "",
            category: "Commerce",
            countryCode: "CD",
            city: s.city,
            province: s.city,
            rating: 4.5,
            reviewCount: 0,
            productCount: s.productCount,
            verified: s.verified,
            topSeller: false,
            featured: false,
            bannerImage: "/images/shops/default-banner.jpg",
            logoImage: "/images/shops/default-logo.jpg",
            bio: "",
            fullAddress: "",
            shippingSpeed: "48h",
            coveredTerritories: "",
            openingHours: "",
            phone: "",
            responseRate: "",
            yearEstablished: "2026",
            performanceScore: { overall: "4.5/5", itemQuality: 4.5, communication: 4.5, shippingSpeed: 4.5 },
            specialties: [],
            productPreviews: [],
          }));

          setShops(mappedShops);
          setProducts(mappedProducts);
          setIsLive(true);
        }
      } catch {
        // Hors ligne ou erreur réseau — afficher état vide (pas de données mock)
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getShopById = useCallback((id: string) => shops.find((s) => s.id === id), [shops]);
  const getProductById = useCallback((id: string) => products.find((p) => p.id === id), [products]);
  const getProductsByShop = useCallback(
    (shopId: string) => products.filter((p) => p.shopId === shopId),
    [products]
  );

  const getAllProductProvinces = useCallback(() => {
    const provinces = new Set<string>();
    products.forEach((p) => {
      if (p.province) provinces.add(p.province);
    });
    return Array.from(provinces).sort();
  }, [products]);

  const getAllShopNames = useCallback(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      if (p.shopName) names.add(p.shopName);
    });
    shops.forEach((s) => {
      if (s.name) names.add(s.name);
    });
    return Array.from(names).sort();
  }, [products, shops]);

  const value = useMemo(
    () => ({
      shops,
      products,
      isLive,
      isLoading,
      getShopById,
      getProductById,
      getProductsByShop,
      getAllProductProvinces,
      getAllShopNames,
    }),
    [
      shops,
      products,
      isLive,
      isLoading,
      getShopById,
      getProductById,
      getProductsByShop,
      getAllProductProvinces,
      getAllShopNames,
    ]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
};
