"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Shop, SHOPS_DATA } from "@/data/shops";
import { ElectronicProduct, ELECTRONICS_PRODUCTS } from "@/data/electronics";
import {
  enrichShopWithRealProducts,
  getShopCountryCode,
  getProductCountryCode,
} from "@/lib/marketData";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type ShopRow = Database["public"]["Tables"]["shops"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/**
 * Fonction unique de mapping des colonnes SQL vers les types TypeScript de l'application
 */
export function mapSupabaseToApp(
  shopRows: ShopRow[],
  productRows: ProductRow[]
): { shops: Shop[]; products: ElectronicProduct[] } {
  // 1. Créer une table de consultation des boutiques pour enrichir les produits
  const shopMap = new Map<string, ShopRow>();
  shopRows.forEach((s) => shopMap.set(s.id, s));

  // 2. Mapper les produits
  const products: ElectronicProduct[] = productRows.map((r) => {
    const parentShop = shopMap.get(r.shop_id);
    return {
      id: r.id,
      shopId: r.shop_id,
      title: r.title,
      shopName: parentShop ? parentShop.name : "Boutique Officielle",
      shopCity: parentShop ? parentShop.city : r.province,
      shopRating: parentShop?.rating ? Number(parentShop.rating) : undefined,
      shopVerified: parentShop ? Boolean(parentShop.verified) : undefined,
      image: r.image,
      images: [r.image],
      usdPrice: Number(r.usd_price),
      originalUsdPrice: r.original_usd_price ? Number(r.original_usd_price) : undefined,
      rating: Number(r.rating ?? 0),
      reviewCount: r.review_count ?? 0,
      category: r.category,
      province: r.province,
      inStock: r.in_stock !== false,
      stockCount: r.stock_count ?? 10,
      description: r.description || undefined,
      features: Array.isArray(r.features) ? r.features : [],
      specifications: (r.specifications as Record<string, string>) || {},
      badges: {
        discount: r.badge_discount || undefined,
        logistics: (r.badge_logistics as any) || undefined,
        logisticsText: r.badge_logistics_text || undefined,
      },
    };
  });

  // 3. Mapper les boutiques
  const rawShops: Shop[] = shopRows.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline || "",
    category: s.category || "Commerce Général",
    countryCode: s.country_code || "CD",
    city: s.city,
    province: s.province,
    rating: Number(s.rating ?? 5.0),
    reviewCount: s.review_count ?? 0,
    productCount: 0,
    verified: Boolean(s.verified),
    topSeller: Boolean(s.top_seller),
    featured: Boolean(s.featured),
    bannerImage: s.banner_image || "/images/shops/default-banner.jpg",
    logoImage: s.logo_image || "/images/shops/default-logo.jpg",
    bio: s.bio || "",
    fullAddress: s.full_address || "",
    shippingSpeed: s.shipping_speed || "48h",
    coveredTerritories: s.covered_territories || "",
    openingHours: s.opening_hours || "08h - 18h",
    phone: s.phone || "",
    whatsapp: s.whatsapp || undefined,
    responseRate: s.response_rate || "98%",
    yearEstablished: s.year_established || "2024",
    performanceScore: {
      overall: s.performance_overall || "4.8/5",
      itemQuality: Number(s.performance_item_quality ?? 4.8),
      communication: Number(s.performance_communication ?? 4.9),
      shippingSpeed: Number(s.performance_shipping ?? 4.7),
    },
    specialties: Array.isArray(s.specialties) ? s.specialties : [],
    productPreviews: [],
  }));

  // 4. Enrichir les boutiques avec les produits réels calculés
  const shops: Shop[] = rawShops.map((shop) => {
    const shopProducts = products.filter((p) => p.shopId === shop.id);
    return {
      ...shop,
      productCount: shopProducts.length,
      productPreviews: shopProducts.slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title,
        image: p.image,
        usdPrice: p.usdPrice,
      })),
    };
  });

  return { shops, products };
}

interface CatalogContextType {
  shops: Shop[];
  products: ElectronicProduct[];
  isLive: boolean;
  getShopById: (id: string) => Shop | undefined;
  getProductById: (id: string) => ElectronicProduct | undefined;
  getProductsByShop: (shopId: string) => ElectronicProduct[];
  getShopsByCountry: (countryCode: string) => Shop[];
  getProductsByCountry: (countryCode: string) => ElectronicProduct[];
  getAllShopProvinces: () => string[];
  getProvincesByCountry: (countryCode: string) => string[];
  getAllProductProvinces: () => string[];
  getProductProvincesByCountry: (countryCode: string) => string[];
  getAllShopNames: () => string[];
  getShopNamesByCountry: (countryCode: string) => string[];
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Affiche immédiatement les données statiques par défaut
  const [shops, setShops] = useState<Shop[]>(() => SHOPS_DATA.map(enrichShopWithRealProducts));
  const [products, setProducts] = useState<ElectronicProduct[]>(ELECTRONICS_PRODUCTS);
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      // Pas de variables Supabase configurées : reste sur les données statiques
      return;
    }

    let isMounted = true;

    async function fetchCatalog() {
      try {
        const [shopsRes, productsRes] = await Promise.all([
          client!.from("shops").select("*").eq("is_active", true),
          client!.from("products").select("*").eq("is_active", true),
        ]);

        if (shopsRes.error) {
          console.warn("[Mwinda Catalog] Erreur chargement boutiques Supabase:", shopsRes.error.message);
          return;
        }
        if (productsRes.error) {
          console.warn("[Mwinda Catalog] Erreur chargement produits Supabase:", productsRes.error.message);
          return;
        }

        // Si la base contient des enregistrements, les mapper et mettre à jour le catalogue
        if (
          shopsRes.data &&
          shopsRes.data.length > 0 &&
          productsRes.data &&
          productsRes.data.length > 0
        ) {
          const mapped = mapSupabaseToApp(shopsRes.data as ShopRow[], productsRes.data as ProductRow[]);
          if (isMounted) {
            setShops(mapped.shops);
            setProducts(mapped.products);
            setIsLive(true);
          }
        }
      } catch (err: any) {
        console.warn("[Mwinda Catalog] Exception chargement Supabase:", err?.message || err);
      }
    }

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const getShopById = useCallback(
    (id: string) => shops.find((s) => s.id === id),
    [shops]
  );

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getProductsByShop = useCallback(
    (shopId: string) => products.filter((p) => p.shopId === shopId),
    [products]
  );

  const getShopsByCountry = useCallback(
    (countryCode: string) => {
      const code = (countryCode || "CD").toUpperCase();
      return shops.filter((s) => getShopCountryCode(s) === code);
    },
    [shops]
  );

  const getProductsByCountry = useCallback(
    (countryCode: string) => {
      const code = (countryCode || "CD").toUpperCase();
      return products.filter((p) => getProductCountryCode(p) === code);
    },
    [products]
  );

  const getAllShopProvinces = useCallback(() => {
    const provinces = new Set<string>();
    shops.forEach((s) => {
      if (s.province) provinces.add(s.province);
    });
    return Array.from(provinces).sort();
  }, [shops]);

  const getProvincesByCountry = useCallback(
    (countryCode: string) => {
      const countryShops = getShopsByCountry(countryCode);
      const provinces = new Set<string>();
      countryShops.forEach((s) => {
        if (s.province) provinces.add(s.province);
      });
      return Array.from(provinces).sort();
    },
    [getShopsByCountry]
  );

  const getAllProductProvinces = useCallback(() => {
    const provinces = new Set<string>();
    products.forEach((p) => {
      if (p.province) provinces.add(p.province);
    });
    return Array.from(provinces).sort();
  }, [products]);

  const getProductProvincesByCountry = useCallback(
    (countryCode: string) => {
      const countryProducts = getProductsByCountry(countryCode);
      const provinces = new Set<string>();
      countryProducts.forEach((p) => {
        if (p.province) provinces.add(p.province);
      });
      return Array.from(provinces).sort();
    },
    [getProductsByCountry]
  );

  const getAllShopNames = useCallback(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      if (p.shopName) names.add(p.shopName);
    });
    return Array.from(names).sort();
  }, [products]);

  const getShopNamesByCountry = useCallback(
    (countryCode: string) => {
      const countryProducts = getProductsByCountry(countryCode);
      const names = new Set<string>();
      countryProducts.forEach((p) => {
        if (p.shopName) names.add(p.shopName);
      });
      return Array.from(names).sort();
    },
    [getProductsByCountry]
  );

  const contextValue = useMemo(
    () => ({
      shops,
      products,
      isLive,
      getShopById,
      getProductById,
      getProductsByShop,
      getShopsByCountry,
      getProductsByCountry,
      getAllShopProvinces,
      getProvincesByCountry,
      getAllProductProvinces,
      getProductProvincesByCountry,
      getAllShopNames,
      getShopNamesByCountry,
    }),
    [
      shops,
      products,
      isLive,
      getShopById,
      getProductById,
      getProductsByShop,
      getShopsByCountry,
      getProductsByCountry,
      getAllShopProvinces,
      getProvincesByCountry,
      getAllProductProvinces,
      getProductProvincesByCountry,
      getAllShopNames,
      getShopNamesByCountry,
    ]
  );

  return <CatalogContext.Provider value={contextValue}>{children}</CatalogContext.Provider>;
};

export const useCatalog = (): CatalogContextType => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
};
