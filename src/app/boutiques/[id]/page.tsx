"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, Product } from "@/components/ProductCard";
import { SHOPS_DATA, getShopById, Shop } from "@/data/shops";
import { ELECTRONICS_PRODUCTS } from "@/data/electronics";
import { useMarket } from "@/context/MarketContext";
import { getCountryByCode } from "@/lib/activeCountries";
import { getShopCountryCode, getProductsByShop, toProductCard } from "@/lib/marketData";
import { useT } from "@/i18n";

interface PageProps {
  params: {
    id: string;
  };
}

// Dedicated catalogue items for Kin Fashion matching the Stitch mockup
const KIN_FASHION_PRODUCTS: Product[] = [
  {
    id: "robe-wax-kinshasa-chic",
    title: "Robe Wax Moderne 'Kinshasa Chic'",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOE2VrMn-FaqeeuMuavYM3Ny7R62p-7Ct-EDnNdes0IOgABkcq8CfnAffh8L8fX4oMw1ACTCZjfetZWxxdzD2oYokYDY4s0iH9YoPU3Nbgifis6BXlRvEKo_e2zMo-ERCRc-l9xN7K15B3DXW4SWDkn8NAsqW68-VUivTEPUL8lw7RfPSe9Ue_EAO_EkWk9Kn8yXnTlWS2lGRac2Zbw8cnVKMXXq4ceE6cA2kWjx40DiL9jKNBFO_0",
    usdPrice: 58,
    originalUsdPrice: 72,
    rating: 4.9,
    reviewCount: 64,
    badges: {
      discount: "-20%",
      logistics: "express",
      logisticsText: "Kin Express 24h",
    },
  },
  {
    id: "chemise-lin-pagne-homme",
    title: "Chemise Lin & Pagne Homme",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDNQHpfX9af0c2GK__PlrBdddc5Pm8y1J3RiFl90DIJIIuzTPECT9qv1BqijQQlQQN112w0Ok3RGzuZHkSnGuz_qKrjFnriDAVYX8kN4oxnsRCbRiIZoZwqe8kme1kTGTDp376YlJN4Jtn5FBiDvNxDO5yzCjHFLNNwzJxtnXJNcjXHyvkylaJeuGJFL6RiXUVYwsnkUJwRryDk-qyBDXESY7NOio0QHfecRgSbRGRAVAHITzRTEs67",
    usdPrice: 45,
    rating: 4.8,
    reviewCount: 42,
    badges: {
      logistics: "express",
      logisticsText: "Nouveau",
    },
  },
  {
    id: "ensemble-tailleur-africain",
    title: "Ensemble Tailleur Indigo Africain",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_8P68bcW7MZgoUr1mO-uy4G6PmqGSIcHP2P2XhNalKfa521dieQGNVSfOlcDRHo0sFpA2tq9QI9whYBlvF11vbbdMecYMcxvLRh1cHdJsufBNvma8M7fULFRdTxeZlGOMdhqlIVvCO8QMFbOp3c84GKyFbGC-Fsojc43f3uSZfMQT8WlBHsn-TbTZATIEbIUjMD6SujECLNW0vv2PAG1I8UhDUl2xQdrcsxYp4CDZmUDDDdBILzl",
    usdPrice: 85,
    originalUsdPrice: 95,
    rating: 5.0,
    reviewCount: 29,
    badges: {
      logistics: "origin-rdc",
      logisticsText: "Fait main RDC",
    },
  },
  {
    id: "robe-fillette-princesse-wax",
    title: "Robe fillette fête 'Princesse Wax'",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHaQ1FeUMygWlaJbSPvPpAFniJdbEMrm4g6J9uGE3nmLwl5HsD61Zick_eMIcTHWEUKNLOYrhnQnI81-WoqtVTsr00W5ReNRpsk556QayRqnZnI8C2Ipv0j8OzKrFI8gxpG63mcma8dr2eqeqdlh8XtknwuMHxd3J9lVV6HtM11t3TZSx8uTvN81Lj5gbyyYHIrfR18C1uxBBMmRPbQc5sbKEiMEF5lMrI1pISAwbZYBx44_qYQye-",
    usdPrice: 32,
    rating: 5.0,
    reviewCount: 31,
    badges: {
      logistics: "express",
      logisticsText: "Kin Express 24h",
    },
  },
  {
    id: "veste-blazer-homme-wax",
    title: "Veste Blazer Homme Motif Wax",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9yB4jT_EWllQ0Jyz_6sP8L6U6TJBieCpo4N14iWX44Lqf6NhR_N9cMGUdXx8F8XjBS8k7IQerHHSdF8le-zwEdfj5EWjJXqkcyg6vOIc3yE0r6QgwoXasMPtd0jSvN-qsXOX8MvrfBxAVn58zBX0cgNhLjCSpEVzu7itavFALvXbvbj7DJuByHzzrk4bhHkqddeq9_SceU6ky8m1MTjdphebh1_Pp6of78UnMuVPltjEmvYU5URQf",
    usdPrice: 95,
    originalUsdPrice: 120,
    rating: 4.9,
    reviewCount: 47,
    badges: {
      discount: "Top Vente",
      logistics: "express",
      logisticsText: "Kin Express 24h",
    },
  },
  {
    id: "collier-perles-traditionnel",
    title: "Collier Perles Traditionnel Fait Main",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBLv0w9vFhqXfBBrpsI8kaoRQcgGfuv8lyZ-pXbuCJCO6uNH1IlE5aNi4TQMkhsqQezXTth0xcPU-SS2gq4zL3wdyTvCvqWa6QeL3eJ5E5j7zv9wj-INodj5ISw8p3HU0fUSqp2Z7TZ_vt7NqZkFBjOUMvj-xNdqgH0yR5IAsMXHjPlsi_8tMbkrM_gMqR7KGw6odIg8LMdAAr5dJ1U_-AZIpJcpIH-J1ehqad6bhHMJtCVif6hVueD",
    usdPrice: 28,
    rating: 4.8,
    reviewCount: 22,
    badges: {
      logistics: "origin-rdc",
      logisticsText: "Fait main RDC",
    },
  },
  {
    id: "robe-longue-evasee-soleil",
    title: "Robe Longue Évasée Soleil Wax",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDWU2bWbtoMLyTOHmtE4iRxCDe7_ae1GjCm98oSo8p5q0_dkCxIbIxkMs62LL-gYiIO6S7X3omYaLORGg1EQ1INeHWY0OkgRlyD0W2mrW3nJeghi4bATwgtVzx3anBfZdvrVnC1Po1Cev7N8pehu34w0qVE7zrhx-oGnYyERKrsE8_9Ol1cjyprYgeL3VWg-iMHFXB6C6I65YFtK3AMWXiWmFPq6H0plyZxKhNAQq5LQ5hKIy54noAT",
    usdPrice: 62,
    rating: 4.9,
    reviewCount: 39,
    badges: {
      logistics: "express",
      logisticsText: "Kin Express 24h",
    },
  },
  {
    id: "ensemble-abacost-modernise",
    title: "Ensemble Abacost Modernisé Anthracite",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDTIrtPGP0FtNVZpS5GXNwdZjeQa5a5X-gQnfA0x13shKuDmI3vkNTJYj0KvGnBAQTwii1mJW-P-9Iv3FDw2P7AsEjGWuWBeur5GbR6mJdBkh1WVxTOq7wiC0F0BptlK3ES_iEq_ufmY4vlAYBLv0lsAx1MdjbMKRUMRDaQEy-GIwOZa_DD-p58lenVWdvhNMFT0VWO3kc8zQDj0rv2xUsQnrw0X8Bp6_9zg4UzzuZuEToW2g6ANmOS",
    usdPrice: 110,
    rating: 5.0,
    reviewCount: 16,
    badges: {
      logistics: "origin-rdc",
      logisticsText: "Nouveau",
    },
  },
  {
    id: "bomber-wax-denim-gombe",
    title: "Bomber Wax & Denim 'Gombe Streetwear'",
    shopName: "Kin Fashion",
    shopCity: "Gombe, Kinshasa",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQvR06gCWmj-EozuKva-SOOuUlf42bGPD78JJHoPCg2NjbAMh_EE7ysGahFdjo5bi5UOnJZfhq-AYy5D0u9mpXVgPSpDrnQc3rC-_9lOgafb8TywIAegjAGqIDjO6Ci7gQ32j3N8BuaSBfKxSC0uDNQK4BqN7HMOccFEpVfk6IAQ_yb6RBT4rvkz1tdoQ0wMUbpp9_y6CBlt4hiBXuvDTwpH0-bluTvG8f63EsxcKeQfwCAtWj8Ev",
    usdPrice: 52.5,
    originalUsdPrice: 70,
    rating: 4.8,
    reviewCount: 58,
    badges: {
      discount: "-25%",
      logistics: "express",
      logisticsText: "Streetwear",
    },
  },
];

export default function ShopDetailPage({ params }: PageProps) {
  const shopId = params?.id || "kin-fashion";
  // B-03: null when ID truly doesn't exist
  const shopFound: Shop | undefined = getShopById(shopId);
  const shop: Shop = shopFound || SHOPS_DATA[0];

  const { t, language } = useT();
  const { country, setCountry } = useMarket();
  const shopCountryCode = getShopCountryCode(shop);
  const isOtherCountry = shopCountryCode !== country.code;
  const shopCountry = getCountryByCode(shopCountryCode);
  const shopCountryName = shopCountry?.name?.[language as "fr" | "en"] || shopCountry?.name?.fr || shopCountryCode;
  const currentCountryName = country.name?.[language as "fr" | "en"] || country.name.fr;
  const shopCountryFlag = shopCountry?.flag || "";

  const [activeTab, setActiveTab] = useState<string>("Tout");
  const [inStoreQuery, setInStoreQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [isFollowing, setIsFollowing] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);

  // Determine which product list to use for this shop
  const baseProducts: Product[] = useMemo(() => {
    if (shop.id === "kin-fashion" || shop.category.includes("Mode")) {
      return KIN_FASHION_PRODUCTS;
    }
    const directShopProducts = getProductsByShop(shop.id);
    if (directShopProducts.length > 0) {
      return directShopProducts.map(toProductCard);
    }
    // Pull matching or mapped products from electronics catalog
    const matched = ELECTRONICS_PRODUCTS.filter(
      (p) =>
        p.shopName.toLowerCase().includes(shop.name.toLowerCase().split(" ")[0]) ||
        shop.specialties.some((s) => p.title.toLowerCase().includes(s.toLowerCase()))
    );
    if (matched.length > 0) {
      return matched.map(toProductCard);
    }
    return ELECTRONICS_PRODUCTS.slice(0, 8).map(toProductCard);
  }, [shop]);

  // Filter and sort products
  const displayedProducts = useMemo(() => {
    let list = [...baseProducts];

    if (inStoreQuery.trim()) {
      const q = inStoreQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (sortOption === "price-asc") {
      list.sort((a, b) => a.usdPrice - b.usdPrice);
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => b.usdPrice - a.usdPrice);
    } else if (sortOption === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [baseProducts, inStoreQuery, sortOption]);

  const handleContact = () => {
    setContactFeedback("Ligne WhatsApp & GSM : " + shop.phone);
    setTimeout(() => setContactFeedback(null), 4000);
  };

  // B-03: état visuel si la boutique est introuvable
  if (!shopFound) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 sm:p-16 text-center max-w-md mx-auto shadow-card space-y-6">
            <div className="w-20 h-20 bg-surface-container text-outline rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">store_off</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-display">
                {t("shop_detail.not_found_title")}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                {t("shop_detail.not_found_desc")}
              </p>
            </div>
            <Link
              href="/boutiques"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-tertiary hover:bg-tertiary-hover text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-md"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>{t("shop_detail.not_found_cta")}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      <Header />

      {/* Bandeau cross-country si la boutique appartient à un autre pays */}
      {isOtherCountry && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-800">
              <span className="material-symbols-outlined text-base text-amber-600">info</span>
              <span>
                {t("shop_detail.cross_market_banner")} <strong>{shopCountryFlag} {shopCountryName}</strong>.{" "}
                {t("shop_detail.cross_market_viewing")} {country.flag} {currentCountryName}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCountry(shopCountryCode)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              <span>{t("shop_detail.switch_market")} {shopCountryName}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-4 sm:py-6 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-outline">
          <Link href="/" className="hover:text-primary transition flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">home</span>
            <span>{t("shop_detail.breadcrumb_home")}</span>
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/boutiques" className="hover:text-primary transition">
            {t("shop_detail.breadcrumb_shops")}
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-on-surface font-semibold truncate max-w-xs">{shop.name}</span>
        </nav>

        {/* 1. STOREFRONT HERO BANNER */}
        <section className="relative rounded-2xl overflow-hidden bg-primary text-white shadow-card border border-outline-variant">
          {/* Ambient Store Banner Background */}
          <div
            className="h-56 sm:h-72 w-full bg-cover bg-center relative"
            style={{ backgroundImage: `url('${shop.bannerImage}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />

            {/* Top Badges overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-200 border border-secondary/40 flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm text-sky-300">bolt</span>
                <span>{t("shop_detail.fast_shipping")}</span>
              </span>
              <span className="bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/20 flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm text-tertiary">local_shipping</span>
                <span>{shopCountryCode === "cd" ? "26 Provinces" : t("shop_detail.regions_covered")}</span>
              </span>
            </div>
          </div>

          {/* Seller Identity & Actions */}
          <div className="px-5 sm:px-8 pb-6 pt-0 relative -mt-16 sm:-mt-20 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              {/* Avatar + Title + Bio */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center p-1 relative">
                    <Image
                      src={shop.logoImage}
                      alt={shop.name}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  {shop.verified && (
                    <span
                      className="absolute bottom-1 right-1 bg-secondary text-white rounded-full p-1 border-2 border-white shadow"
                      title="Boutique Certifiée Mwinda"
                    >
                      <span className="material-symbols-outlined text-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                      {shop.name}
                    </h1>
                    <span className="bg-white/10 text-white/90 border border-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                      <span>{shopCountryFlag}</span>
                      <span>{shop.city}, {shopCountryName}</span>
                    </span>
                    {shop.verified && (
                      <span className="bg-secondary-fixed/20 text-sky-200 border border-secondary-fixed/40 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">workspace_premium</span>
                        <span>{t("shop_detail.certified_seller")}</span>
                      </span>
                    )}
                    {shop.topSeller && (
                      <span className="bg-tertiary/30 text-amber-200 border border-tertiary/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {t("shop_detail.top_seller")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    {shop.bio}
                  </p>
                </div>
              </div>

              {/* CTAs: Follow, Contact */}
              <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
                <button
                  type="button"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow flex items-center gap-2 active:scale-95 ${
                    isFollowing
                      ? "bg-emerald-600 text-white"
                      : "bg-tertiary hover:bg-tertiary-hover text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isFollowing ? "check" : "notifications_active"}
                  </span>
                  <span>{isFollowing ? t("shop_detail.following") : t("shop_detail.follow")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleContact}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined text-base text-sky-200">chat</span>
                  <span>{t("shop_detail.contact_seller")}</span>
                </button>
              </div>
            </div>

            {/* Contact Feedback Banner */}
            {contactFeedback && (
              <div className="p-3 bg-secondary/30 border border-secondary/50 rounded-xl text-xs text-white flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">info</span>
                  <span>{contactFeedback}</span>
                </div>
                <a
                  href={`tel:${shop.phone.replace(/\s+/g, "")}`}
                  className="font-bold underline text-sky-200 ml-2"
                >
                  {t("shop_detail.call_directly")}
                </a>
              </div>
            )}

            {/* Metrics Strip */}
            <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1 font-bold text-white text-sm sm:text-base">
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-xs font-normal">/5</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{shop.reviewCount} {t("shop_detail.verified_reviews")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-300 shrink-0">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm sm:text-base">{shop.productCount}</span>
                  <p className="text-[11px] text-slate-300">{t("shop_detail.online_articles")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm sm:text-base">{shop.responseRate}</span>
                  <p className="text-[11px] text-slate-300">{t("shop_detail.response_rate")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm sm:text-base">{t("shop_detail.since")} {shop.yearEstablished}</span>
                  <p className="text-[11px] text-slate-300">{t("shops.certified_seller")} {shopCountryName}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. STORE TOOLBAR (CATEGORIES & SEARCH) */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-card p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("Tout")}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "Tout"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span>{t("shop_detail.all_catalog")}</span>
                <span className="text-[10px] bg-tertiary px-1.5 py-0.5 rounded-full text-white">
                  {displayedProducts.length}
                </span>
              </button>

              {shop.specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setActiveTab(spec)}
                  className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === spec
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <span>{spec}</span>
                </button>
              ))}
            </div>

            {/* In-Store Search & Sorting */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <input
                  type="text"
                  value={inStoreQuery}
                  onChange={(e) => setInStoreQuery(e.target.value)}
                  placeholder={`${t("shop_detail.search_placeholder")}`}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-primary placeholder:text-outline"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
                  search
                </span>
              </div>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="py-2 px-3 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
              >
                <option value="newest">{t("catalog.sort_newest")}</option>
                <option value="rating">{t("catalog.sort_popular")}</option>
                <option value="price-asc">{t("catalog.sort_price_asc")}</option>
                <option value="price-desc">{t("catalog.sort_price_desc")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. 2-COLUMN LAYOUT: PRODUCTS (LEFT ~8 COLS) + STORE SIDEBAR (RIGHT ~4 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Products Grid */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <h2 className="text-base sm:text-lg font-bold text-primary font-display flex items-center gap-2">
                <span>{t("shop_detail.available_articles")}</span>
                <span className="text-xs font-semibold text-outline">({displayedProducts.length})</span>
              </h2>
              <span className="text-xs text-secondary font-semibold">{t("shop_detail.certified_stock")} {shopCountryName}</span>
            </div>

            {displayedProducts.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-10 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline">inventory</span>
                <h3 className="text-sm font-bold text-primary">{t("shop_detail.no_articles_found")}</h3>
                <p className="text-xs text-on-surface-variant">
                  {t("shop_detail.no_articles_desc")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInStoreQuery("");
                    setActiveTab("Tout");
                  }}
                  className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold"
                >
                  {t("shop_detail.show_all_articles")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* Right Store Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-6">
            {/* About the Store */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <h3 className="text-sm sm:text-base font-bold text-primary font-display">
                  {t("shop_detail.about_shop")} {shop.name}
                </h3>
                <span className="material-symbols-outlined text-secondary text-xl">storefront</span>
              </div>

              {/* Physical Location */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-secondary">
                  <span className="material-symbols-outlined text-lg">pin_drop</span>
                </div>
                <div>
                  <p className="text-[11px] text-outline font-semibold uppercase tracking-wider">
                    {t("shop_detail.physical_store")}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                    {shop.fullAddress}
                  </p>
                  <span className="text-[11px] text-secondary font-medium inline-block mt-0.5">
                    {t("shop_detail.gps_verified")}
                  </span>
                </div>
              </div>

              {/* Shipping Delay */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-tertiary">
                  <span className="material-symbols-outlined text-lg">timer</span>
                </div>
                <div>
                  <p className="text-[11px] text-outline font-semibold uppercase tracking-wider">
                    {t("shop_detail.shipping_speed")}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                    {shop.shippingSpeed}
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {shop.city} : livraison le jour même. Autres provinces : 48 à 72h via hub Mwinda.
                  </p>
                </div>
              </div>

              {/* Covered Territories */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-secondary">
                  <span className="material-symbols-outlined text-lg">public</span>
                </div>
                <div>
                  <p className="text-[11px] text-outline font-semibold uppercase tracking-wider">
                    {t("shop_detail.covered_territories")}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                    {shop.coveredTerritories}
                  </p>
                  <span className="inline-block mt-1 bg-surface-container-low px-2 py-0.5 rounded text-[10px] font-bold text-secondary">
                    Mwinda Express Inter-provinces
                  </span>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-outline">
                  <span className="material-symbols-outlined text-lg">alarm</span>
                </div>
                <div>
                  <p className="text-[11px] text-outline font-semibold uppercase tracking-wider">
                    {t("shop_detail.opening_hours")}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                    {shop.openingHours}
                  </p>
                </div>
              </div>

              {/* Performance Score */}
              <div className="pt-4 border-t border-outline-variant space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">{t("shop_detail.performance_score")}</span>
                  <span className="font-bold text-secondary font-mono">{shop.performanceScore.overall}</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <div className="flex justify-between text-on-surface-variant mb-1">
                      <span>{t("shop_detail.item_quality")}</span>
                      <span className="font-bold text-primary">{shop.performanceScore.itemQuality} / 5</span>
                    </div>
                    <div className="w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "98%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-on-surface-variant mb-1">
                      <span>{t("shop_detail.communication")}</span>
                      <span className="font-bold text-primary">{shop.performanceScore.communication} / 5</span>
                    </div>
                    <div className="w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-on-surface-variant mb-1">
                      <span>{t("shop_detail.shipping_speed_score")}</span>
                      <span className="font-bold text-primary">{shop.performanceScore.shippingSpeed} / 5</span>
                    </div>
                    <div className="w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "96%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accepted Payment Badges */}
              <div className="pt-4 border-t border-outline-variant space-y-2">
                <p className="text-[11px] text-outline font-bold uppercase tracking-wider">
                  {t("shop_detail.secure_payments")}
                </p>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant text-primary">
                    M-Pesa
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant text-primary">
                    Orange Money
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant text-primary">
                    Airtel Money
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant text-primary">
                    Visa / Mastercard
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
