export interface ShopProductPreview {
  id: string;
  title: string;
  image: string;
  usdPrice: number;
}

export interface Shop {
  id: string;
  name: string;
  tagline: string;
  category: string;
  countryCode?: string; // ISO 3166-1 alpha-2 (ex: "CD", "CG", "RW", "KE", "CI", "AO")
  city: string;
  province: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  verified: boolean;
  topSeller?: boolean;
  featured?: boolean;
  bannerImage: string;
  logoImage: string;
  bio: string;
  fullAddress: string;
  shippingSpeed: string;
  coveredTerritories: string;
  openingHours: string;
  phone: string;
  whatsapp?: string;
  responseRate: string;
  yearEstablished: string;
  performanceScore: {
    overall: string;
    itemQuality: number;
    communication: number;
    shippingSpeed: number;
  };
  specialties: string[];
  productPreviews: ShopProductPreview[];
}

export const SHOPS_DATA: Shop[] = [
  {
    id: "kin-fashion",
    name: "Kin Fashion",
    tagline: "Mode Wax & Prêt-à-porter Contemporain",
    category: "Mode & Habillement",
    countryCode: "CD",
    city: "Kinshasa",
    province: "Kinshasa",
    rating: 4.9,
    reviewCount: 348,
    productCount: 215,
    verified: true,
    topSeller: true,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXLLByVIn37rtgmdlPmOwPB_QkTmusgJfsiBbBzBkw4ssiK7Idg1TsB6yGHTnrwAYqdxILBzA_1nFDYcv62urYJZ905BSIi8JfMcxVvp_37eu7nEj90ivpL7kadVqyWPQ5lULtn3yFkpFCuNd3IJlTQLsgjEWGhEslDtw6t8cQpYyhRIMb-D-PjrvxodB_pFKepmLGnZoHFDJ_HZEUr8Cz_4y4EY7ORXc7GQ7EMj5LxFHX_zOUTkZ1",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBo4LIqKXAKaCQI7Mm9U7CMse1-xZrTjsF0HV1o7ZEAWdqvGuTZjRu_9r34OcT4TkOmDtC3-yqSXuEs8m7H_F539QDFphwKzP1GM5LwTfPGgy6Q2sqMgLcIX9g8zPvasTcMZVlZJdlnkVzGh5mw_yzJqszKFvTBrzLnhfoWHbaOLDPmR2YUEs0ePHAquMKsFCDyeUiPKnM37wd8t5hqmRpVwxx4313h6A3n7PyxKGNziv7RTGL_IGLq",
    bio: "Créateur et distributeur officiel de mode contemporaine congolaise et pagnes Wax haute couture. Confection locale et prêt-à-porter de qualité supérieure pour toute la famille. Expédition express à Kinshasa et vers les 26 provinces.",
    fullAddress: "Galerie Saint-Pierre, Boulevard du 30 Juin, Gombe, Kinshasa, RDC",
    shippingSpeed: "Expédié en 24h ouvrées (Même jour sur Kinshasa)",
    coveredTerritories: "Kinshasa & les 26 provinces de la RDC",
    openingHours: "Lun - Sam : 08h30 - 18h30 (Commandes 24/7)",
    phone: "+243 81 890 0125",
    whatsapp: "+243 81 890 0125",
    responseRate: "98% (< 15 min)",
    yearEstablished: "2023",
    performanceScore: {
      overall: "99.2%",
      itemQuality: 4.9,
      communication: 5.0,
      shippingSpeed: 4.8,
    },
    specialties: ["Robes Wax sur mesure", "Ensembles Abacost", "Prêt-à-porter Homme & Femme", "Accessoires en raphia"],
    productPreviews: [
      {
        id: "robe-wax-moderne",
        title: "Robe Wax Moderne 'Kinshasa Chic'",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCOE2VrMn-FaqeeuMuavYM3Ny7R62p-7Ct-EDnNdes0IOgABkcq8CfnAffh8L8fX4oMw1ACTCZjfetZWxxdzD2oYokYDY4s0iH9YoPU3Nbgifis6BXlRvEKo_e2zMo-ERCRc-l9xN7K15B3DXW4SWDkn8NAsqW68-VUivTEPUL8lw7RfPSe9Ue_EAO_EkWk9Kn8yXnTlWS2lGRac2Zbw8cnVKMXXq4ceE6cA2kWjx40DiL9jKNBFO_0",
        usdPrice: 58,
      },
      {
        id: "chemise-lin-pagne",
        title: "Chemise Lin & Pagne Homme",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDNQHpfX9af0c2GK__PlrBdddc5Pm8y1J3RiFl90DIJIIuzTPECT9qv1BqijQQlQQN112w0Ok3RGzuZHkSnGuz_qKrjFnriDAVYX8kN4oxnsRCbRiIZoZwqe8kme1kTGTDp376YlJN4Jtn5FBiDvNxDO5yzCjHFLNNwzJxtnXJNcjXHyvkylaJeuGJFL6RiXUVYwsnkUJwRryDk-qyBDXESY7NOio0QHfecRgSbRGRAVAHITzRTEs67",
        usdPrice: 45,
      },
      {
        id: "ensemble-tailleur-africain",
        title: "Ensemble Tailleur Indigo Africain",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_8P68bcW7MZgoUr1mO-uy4G6PmqGSIcHP2P2XhNalKfa521dieQGNVSfOlcDRHo0sFpA2tq9QI9whYBlvF11vbbdMecYMcxvLRh1cHdJsufBNvma8M7fULFRdTxeZlGOMdhqlIVvCO8QMFbOp3c84GKyFbGC-Fsojc43f3uSZfMQT8WlBHsn-TbTZATIEbIUjMD6SujECLNW0vv2PAG1I8UhDUl2xQdrcsxYp4CDZmUDDDdBILzl",
        usdPrice: 85,
      },
    ],
  },
  {
    id: "kazi-tech",
    countryCode: "CD",
    name: "Kazi Tech Kinshasa",
    tagline: "Informatique, Smartphones & Matériel Pro",
    category: "Électronique & High-Tech",
    city: "Kinshasa",
    province: "Kinshasa",
    rating: 4.9,
    reviewCount: 184,
    productCount: 340,
    verified: true,
    topSeller: true,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC5fnvcLrfrsiVwqJTWuCrSRcyOfLgAZMtRBMiToLqlc3ro5IxNEYWAufKkrm46FYZTYmg6aU4nlxJHfMV3dWD9NxfbjicZHqhtvcno0nw39ZntcfS-eG6dFi7iUfbYvCVnB8LtjnsS8xYg0kqPzcuPfhlJg3H64FQd99PNe3DpNb9OVqQlRywnjuPLXHihnMCmAL4mLCDdIkyN-nKNj7AR6F8FvYbNzIQ2W8wFE600QQ4lyu5A0vcu",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDW2B0aLul7F-oKti40615pW6oXFNT0etxomhACJqzdw6mfFcdzZzGvXXj8EIx2xucr7-O2Yt4FJfIKoV3yC21lDfQKvNNaTSdpb9vAaPNET7iXsStYG3NhWValqPqRrbhJQ69Ch1R_vkygZQIbeSwriC7L1CN2_g6G8cGaIqYMeubiqsKOntkvHxOUwf11y_DzshUdGfcvDP74kWW9xyIwy-t8SjUN1DKf9n1KEQP34bwUGyHCytcI",
    bio: "Boutique leader en informatique, laptops professionnels, tablettes graphiques et smartphones certifiés avec garantie constructeur 1 an en RDC. Service après-vente et maintenance sur Kinshasa Gombe.",
    fullAddress: "142 Avenue Colonel Mondjiba, Concession Utexafrica, Gombe, Kinshasa, RDC",
    shippingSpeed: "Expédié sous 12h à 24h",
    coveredTerritories: "Kinshasa & 26 provinces de la RDC",
    openingHours: "Lun - Sam : 08h00 - 18h00",
    phone: "+243 81 222 3344",
    whatsapp: "+243 81 222 3344",
    responseRate: "99% (< 10 min)",
    yearEstablished: "2021",
    performanceScore: {
      overall: "99.5%",
      itemQuality: 4.9,
      communication: 4.9,
      shippingSpeed: 4.9,
    },
    specialties: ["PC Portables Pro", "Smartphones 5G", "Écrans 4K & Périphériques", "Onduleurs bureautique"],
    productPreviews: [
      {
        id: "smartphone-flagship",
        title: "Smartphone Pro 5G 256GB Dual SIM",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDE2w5nG-xGZjrkidy3oKM622XTU4aJkfEV3l16a_mBCGuARLqzaQCx15FghlqZRcvXYeVhuxl0jFXw_jH3-KMMTshESgn6eD5TW4_x4hRp37Cfx75CHQ5Sbu8KfmZbH0J2v6xVSG67lvs6oEACvV0okMDPZHS3R8ZYro793HQliM2ESGfmNUKVfnxJUFNrHUHtJgi83hmgsnsSbyJipxkIosomBPzFa2YG-Y7x3CebC6MwEJEamd6Q",
        usdPrice: 280,
      },
      {
        id: "laptop-pro-slim",
        title: "PC Portable Ultra-Slim 16GB / 512GB SSD",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBdIy_XtPlb1nVVJTc53OhW9_rPX994eAHPWhq3OrQZ9_t2mEuwmHxoKT3WX9vRUFJTMc1XfRn_thos7G-qZoj3HuBGpwh5GJfUjz__Xy-hL8l6bY-O45cZT7CttI25S3SUotsrdyAsNFqL2wl-tWyjjXI5o8anfo_zCn2Iq5vvy0VvE6aRiVSOV4WfhsqE_v5JmOFU23ozrOcvqe1n9WQL4n0u_r_tdgEhMC6TuByeIOSE9t-rOPnb",
        usdPrice: 520,
      },
      {
        id: "casque-pro-anc",
        title: "Casque Audio Sans Fil Réduction de Bruit",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBDIAwMPIla-dPvMv0GEBxCl4WYHJAlh0DDpLvvTEZ3-K2oVrlzsS9RZRAo9UDd5FDJMBeiS5zoJQjgORZ06jydn2MfOZB16U0VHGLaWBNwmnpyIIrssJPm7pOT5SdNDcNXBdqAfWS3tqxcpccrA4Ag1OMqMWGrhdAJLI8tQ9bINAAcJutpXunV0Xsrx0TQweImGSVQPuH0TPr4MeSdDSdItSazcWtNA3yJ-Tf1bXK7rUKHB0n02e-y",
        usdPrice: 65,
      },
    ],
  },
  {
    id: "solaris-rdc",
    countryCode: "CD",
    name: "Solaris RDC",
    tagline: "Systèmes Solaires, Batteries & Onduleurs Hybrides",
    category: "Énergie Solaire",
    city: "Matadi",
    province: "Kongo Central",
    rating: 4.9,
    reviewCount: 210,
    productCount: 165,
    verified: true,
    topSeller: true,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmXvfXwTplOwxgiJSx77S7jwTTpZ8JC6jwsJkDBxGUAuYb2ISq2w7Dd5KmxiP3VGTqPnQaFJ-XvGGOH4t-BOxDhG_bz6OGLB74m-ihjwpe6I7hvGgxva8brMHKPYTDz6dmidEFXg9OPv14a2nNr_DDXYoPt05RR8OLvBb4dnSgsMvKAgzE4-yJgSKDqVyj1zeKvHxzAq9GB1TKlLWtph7tDGM5vjkclHkTieQNFPxfadZthzHrkJ3x",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCoFQdUnDlpLxKt_YJi0oYUfaDziiIUi-Xtv96uMeL_B1tL3Q9vrLZPSubeOa7Neqh69XnKMrpYfS-3bS7FM8pjI872JBjdtnnHQLmgrv0iLiFG6DAApbn_ZoIK0XwlA9suS7hFOLdWC1gDvTNTZgyhbKnv-Lt5K7jMib08ZcO6cfp96HVMgfmcz-TNIukREamfABhZL2yznsqWov1MWuzrQPWx98mP04ZM_EB8kNeZxqTRoB2AXTSR",
    bio: "Spécialiste de la transition énergétique en RDC. Stations d'énergie portables 500W à 3000W, kits solaires autonomes pour foyers et commerces, panneaux monocristallins et batteries lithium longue durée.",
    fullAddress: "Avenue Kinkanda, Port de Matadi & Hub Gombe Kinshasa, RDC",
    shippingSpeed: "Expédition interprovinciale 24-48h",
    coveredTerritories: "Kongo Central, Kinshasa, Bandundu et toutes les 26 provinces",
    openingHours: "Lun - Sam : 08h00 - 17h30",
    phone: "+243 89 555 4411",
    whatsapp: "+243 89 555 4411",
    responseRate: "97% (< 20 min)",
    yearEstablished: "2020",
    performanceScore: {
      overall: "99.1%",
      itemQuality: 5.0,
      communication: 4.8,
      shippingSpeed: 4.9,
    },
    specialties: ["Stations Solaire 1000W / 2000W", "Panneaux Solaires 200W-450W", "Onduleurs Hybrides Pur Sinus", "Ventilateurs solaires"],
    productPreviews: [
      {
        id: "station-solaire-1000w",
        title: "Station Solaire Hybride 1000W / 220V",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCoFQdUnDlpLxKt_YJi0oYUfaDziiIUi-Xtv96uMeL_B1tL3Q9vrLZPSubeOa7Neqh69XnKMrpYfS-3bS7FM8pjI872JBjdtnnHQLmgrv0iLiFG6DAApbn_ZoIK0XwlA9suS7hFOLdWC1gDvTNTZgyhbKnv-Lt5K7jMib08ZcO6cfp96HVMgfmcz-TNIukREamfABhZL2yznsqWov1MWuzrQPWx98mP04ZM_EB8kNeZxqTRoB2AXTSR",
        usdPrice: 640,
      },
      {
        id: "panneau-solaire-300w",
        title: "Panneau Solaire Monocristallin 300W",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDmXvfXwTplOwxgiJSx77S7jwTTpZ8JC6jwsJkDBxGUAuYb2ISq2w7Dd5KmxiP3VGTqPnQaFJ-XvGGOH4t-BOxDhG_bz6OGLB74m-ihjwpe6I7hvGgxva8brMHKPYTDz6dmidEFXg9OPv14a2nNr_DDXYoPt05RR8OLvBb4dnSgsMvKAgzE4-yJgSKDqVyj1zeKvHxzAq9GB1TKlLWtph7tDGM5vjkclHkTieQNFPxfadZthzHrkJ3x",
        usdPrice: 165,
      },
      {
        id: "ventilateur-solaire-rechargeable",
        title: "Ventilateur Solaire Silencieux Rechargeable",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAPrkP7xd3lO1jaQRCUMHK8msKxNEHxS3Y5Hn1diue0mvvWsFIBzeHZZyWO9w5a3q8bXYuxJFDrMRmmEhd5HJVg4LDfdCs5x2f0I9UMcWBxb_Inr99uuIitkUrknlNiCQdTF1H0IPhW4XpX_zkdV5dGDMwJIm8ZneC1K9KrDf6kTOBc5I17Oczwr9ZilmvVcL812ZK0yq4Yh1Mf3e9-kueGyUZ0f9qfR0cvd4PwHYsVLmIDD0_oC2Om",
        usdPrice: 84,
      },
    ],
  },
  {
    id: "mode-elegance",
    countryCode: "CD",
    name: "Mode Élégance Lubumbashi",
    tagline: "Haute Couture Africaine & Prêt-à-Porter Katanga",
    category: "Mode & Habillement",
    city: "Lubumbashi",
    province: "Haut-Katanga",
    rating: 4.8,
    reviewCount: 129,
    productCount: 180,
    verified: true,
    topSeller: false,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDoBzfhhyDy_fnenTMza0OyQk826a0ctH6CbwYXRYkbQI4j8F08-1sZyT2FqZloCWp5x219RuTgmA5bVY4Il4FBPp_FxMdbyHjLyZN1L60KVFbf44KHCLfILSf14C-BqVx0LYRGIKri-MmsidlMlGlAqEXrMnhu8mEMuaLXBG8tmzD9XWotDb5WoKHnyRUTATlGOkWZM4zJARuBBldmLyEfWbIDD_PFAFDkQcX_KAcPxwrzkJzm83Jq",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD1G_cQ5MJx7yT94NaVsnjASv2GIViVPvsq_BciEqK1t9IKS29CGnzp2P5jrGfYFwEGeRupzz6ABENYyBF184HmVOdHgkVUgSK64nYgSHk_WbmQwXnYpJti4e7x-CDOQhSTRMZxLnwwex9hezEdzDcqJ_37tiRmi03xQwhRlJKdyxa7OpcJj5Ne4iRC7uBcK-77bQbCpUIJbb6m6Ut1p4xsMiNJpnX9LJsuJFIjmp7AEWMyTsZOT3HU",
    bio: "Showroom haute-couture de Lubumbashi. Créations raffinées en Wax hollandais véritable, costumes sur mesure pour hommes d'affaires et robes d'apparat livrables dans tout le Grand Katanga et la RDC.",
    fullAddress: "Croisement Av. Kasa-Vubu & Chaussée Mzee L.D. Kabila, Lubumbashi, Haut-Katanga, RDC",
    shippingSpeed: "Expédié sous 24h ouvrées",
    coveredTerritories: "Grand Katanga & toutes les 26 provinces",
    openingHours: "Lun - Sam : 09h00 - 18h30",
    phone: "+243 99 778 1234",
    whatsapp: "+243 99 778 1234",
    responseRate: "96%",
    yearEstablished: "2022",
    performanceScore: {
      overall: "98.7%",
      itemQuality: 4.9,
      communication: 4.8,
      shippingSpeed: 4.7,
    },
    specialties: ["Costumes Katangais", "Robes de soirée Wax", "Maroquinerie artisanale"],
    productPreviews: [
      {
        id: "wax-lubumbashi-couture",
        title: "Pagne Wax Hollandais Authentique 6 Yards",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDcdUNMdy5NDC9IV6CmDsI3m19B0BliOfIjVpJ_iyoQ8ofRYkPI_y0Qlc9lzwuoLOFVF9QldP0I0B2N3-gsIw7serbHsazpsL3sZoYJH3YjbAbzmfq3SEumwRUk7e-lyMj0s4Jjt03PAmSwPx2L88cnGbBSzPqbwUfuccuTmzqRUdFm-3COtjw6Hxh59VacJkeAv2GR-ALs44PH555SpcMzqIGPb3rlstB5PItlwkC7NPcvnVey53VR",
        usdPrice: 75,
      },
      {
        id: "costume-homme-embroidery",
        title: "Veste Homme Tailleur Katangais",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCla5ThgFxS96e2WkLLWIzaH5PT-B9cAz6mj3Mi4aRY16PQFcvPBwzKagRlkX8V2ZrbdHsYz-EQ6soNTellmoUn6J1hHZyLtC2g22j1QI7NVvytG9ty-vFWRYKK7GuIQlkUEdk4IhISM_K0zHmDB0oVh8gLhyaz3giN4swnjOIQVzFbWAAPfTTJr-KL-8sv5Q13Dc4hI5kv7So6EEYv7P0NBNpng3uQ9o4B_6x4EuLvphYR7JBjsojA",
        usdPrice: 110,
      },
      {
        id: "sac-main-cuir-artisanal",
        title: "Sac à Main Cuir & Pagne Fait Main",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBrRw2yKzhHznuxO9giDTpzm5F6N3EBiJf73aX3r3TxVNpqQV6IOD4dIXq5CSJjA_XF0EmJd9CtPbv9OkKaFreqLXFCBY6Beo8A1WVYev26kQ-5aIqcVtgXpTNwolfbnGEP8UpcqQ5yFavo9af6dNoeCaG-NBuCa-rLdb4W7fwRd-liwPo52YpoYE58Nt5ob-gNP00Rf0xQB_0rW3n5XC-_VTNPJkQ564yYfqrnrzh9RsY7ijTfGzZD",
        usdPrice: 48,
      },
    ],
  },
  {
    id: "maison-deco-goma",
    countryCode: "CD",
    name: "Maison & Déco Goma",
    tagline: "Mobilier Contemporain, Artisanat & Décoration Kivu",
    category: "Maison & Mobilier",
    city: "Goma",
    province: "Nord-Kivu",
    rating: 4.8,
    reviewCount: 96,
    productCount: 140,
    verified: true,
    topSeller: false,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcGVvOXoF913IwJEHHVZmbqGO-Xzy70tZwawCxaKO9NTtcjaVJVvK3EmmP87aN_ExPiGqDeyetLkKzatgS2dVSCBTgHdlZ5sp-tdbfivtVmJ0Po2j90kZL1dFQ0CnsViFAEDoIqdSo1-i9bYF1_BRXqXjXNEsQp1_BXqxEh_dNbB55y8nksur5uTGoZ5-M3iYayW9fmW9pDpP3h5tasL87jv9c_PLZVq9bqftcxuOqlLtXyxVnJHw",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAC-bxi-uatLB2wlU8bagfEQ-77He58q4CGVB893Xd05u3VNHnbispCMARX9_QNfmHKNJDyuk-GAeBmP3z7SSmpPs0WZEg1-GreEJIH1lBYOaCWZSxUN4YXZyL5vAJhuz-kMIl2d6mr1RdODtwd43ebBp1-KDCMmxtA4HJzPzro5x-zavgSH8BuO43oh_avGUbPTYrPWPrklX-y-QWePHuqTVChrXJFoWlI1HEhHKf2ZirB4FxQr3jS",
    bio: "Artisanat noble et design d'intérieur au Nord-Kivu. Meubles en bois massif de teck et d'acajou, luminaires scandinaves-africains et accessoires décoratifs modernes.",
    fullAddress: "Quartier Les Volcans, Boulevard Kanyamuhanga, Goma, Nord-Kivu, RDC",
    shippingSpeed: "Expédié sous 48h ouvrées",
    coveredTerritories: "Nord-Kivu, Sud-Kivu, Kinshasa et réseau national",
    openingHours: "Lun - Sam : 08h30 - 18h00",
    phone: "+243 85 400 9900",
    responseRate: "95%",
    yearEstablished: "2020",
    performanceScore: {
      overall: "98.2%",
      itemQuality: 4.9,
      communication: 4.8,
      shippingSpeed: 4.6,
    },
    specialties: ["Tables en teck massif", "Salons design Kivu", "Luminaires artisanaux"],
    productPreviews: [
      {
        id: "table-bois-teck",
        title: "Table Basse Artisanale Teck Massif",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcGVvOXoF913IwJEHHVZmbqGO-Xzy70tZwawCxaKO9NTtcjaVJVvK3EmmP87aN_ExPiGqDeyetLkKzatgS2dVSCBTgHdlZ5sp-tdbfivtVmJ0Po2j90kZL1dFQ0CnsViFAEDoIqdSo1-i9bYF1_BRXqXjXNEsQp1_BXqxEh_dNbB55y8nksur5uTGoZ5-M3iYayW9fmW9pDpP3h5tasL87jv9c_PLZVq9bqftcxuOqlLtXyxVnJHw",
        usdPrice: 195,
      },
    ],
  },
  {
    id: "saveurs-du-kivu",
    countryCode: "CD",
    name: "Saveurs du Kivu",
    tagline: "Café d'Origine, Miel Sauvage & Épices des Grands Lacs",
    category: "Alimentation & Terroir",
    city: "Bukavu",
    province: "Sud-Kivu",
    rating: 4.9,
    reviewCount: 165,
    productCount: 65,
    verified: true,
    topSeller: true,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgUeMQPo6fLGbXbFYDbG76bGBhkpjK-N1NcbzhLuu1HPbmGnKM-nP4w_TVtx4LQd-FMiNkDj3Yk7NixZCTKpWWEgHlcaV01HQF0j64fLusJG6x7qjdHve4k-jf_TK2C3ycQ-XT8FtvsQPDKA89XzcMidf4WsCksyEzHdTnvSD_bPM9mNtrNplTXhAdOXL9A6rmElUudfeTaL60SPmIo0voTJ8bIdgvB5i9hNTCI_nQgWTkAcrqO7rA",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgUeMQPo6fLGbXbFYDbG76bGBhkpjK-N1NcbzhLuu1HPbmGnKM-nP4w_TVtx4LQd-FMiNkDj3Yk7NixZCTKpWWEgHlcaV01HQF0j64fLusJG6x7qjdHve4k-jf_TK2C3ycQ-XT8FtvsQPDKA89XzcMidf4WsCksyEzHdTnvSD_bPM9mNtrNplTXhAdOXL9A6rmElUudfeTaL60SPmIo0voTJ8bIdgvB5i9hNTCI_nQgWTkAcrqO7rA",
    bio: "Coopérative de producteurs certifiés du Sud-Kivu. Café Arabica Bourbon biologique primé, miel pur d'altitude, thé noir de Mwenga et épices équitables conditionnées sous vide.",
    fullAddress: "Avenue Maniema, Place de l'Indépendance, Bukavu, Sud-Kivu, RDC",
    shippingSpeed: "Expédié sous 24h ouvrées",
    coveredTerritories: "Grand Kivu, Kinshasa et livraison nationale",
    openingHours: "Lun - Sam : 08h00 - 17h00",
    phone: "+243 85 999 1100",
    responseRate: "97%",
    yearEstablished: "2019",
    performanceScore: {
      overall: "99.0%",
      itemQuality: 5.0,
      communication: 4.9,
      shippingSpeed: 4.8,
    },
    specialties: ["Café Arabica Bourbon Bio", "Miel Sauvage d'Altitude", "Thé Noir de Mwenga"],
    productPreviews: [],
  },
  {
    id: "kin-bourse-high-tech",
    countryCode: "CD",
    name: "Kin Bourse High-Tech",
    tagline: "Accessoires Mobiles, Audio & Électronique Urbaine",
    category: "Électronique & High-Tech",
    city: "Kinshasa",
    province: "Kinshasa",
    rating: 4.7,
    reviewCount: 142,
    productCount: 190,
    verified: true,
    topSeller: false,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVXnkcQ9M4ypR_WjnwEz9_U_keYyPiyWC3xYO_Cq_Ng8pO-2a4eotSrSwuWVOsd2PRPH-BWfGpexGuit0Md_7IQUJtyYkOORHl2ErrO-CGKwuvBhx5Rv9KYd8CFipKpZwzP8Jl1zVPnSs3wqQUGcTlKTEMJ6PkhAd83wXC_o634LHX63K74ySxRBseoEUy8qohH5LlOuiDkXPJfI3J5HKnoPc2jRTu_3iKhTQ7vjlk5BhybEduYcQb",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVXnkcQ9M4ypR_WjnwEz9_U_keYyPiyWC3xYO_Cq_Ng8pO-2a4eotSrSwuWVOsd2PRPH-BWfGpexGuit0Md_7IQUJtyYkOORHl2ErrO-CGKwuvBhx5Rv9KYd8CFipKpZwzP8Jl1zVPnSs3wqQUGcTlKTEMJ6PkhAd83wXC_o634LHX63K74ySxRBseoEUy8qohH5LlOuiDkXPJfI3J5HKnoPc2jRTu_3iKhTQ7vjlk5BhybEduYcQb",
    bio: "Spécialiste des accessoires nomades à Kinshasa. Écouteurs sans fil avec annulation active de bruit, powerbanks haute capacité, câbles renforcés et chargeurs solaires nomades.",
    fullAddress: "7ème Rue Limete Résidentiel, Kinshasa, RDC",
    shippingSpeed: "Livraison le jour même sur Kinshasa",
    coveredTerritories: "Kinshasa & 26 provinces",
    openingHours: "Lun - Sam : 08h30 - 18h30",
    phone: "+243 81 777 8899",
    responseRate: "98%",
    yearEstablished: "2022",
    performanceScore: {
      overall: "97.8%",
      itemQuality: 4.8,
      communication: 4.9,
      shippingSpeed: 4.8,
    },
    specialties: ["Écouteurs Pro ANC", "Powerbanks 20000mAh", "Chargeurs GaN 65W"],
    productPreviews: [],
  },
  {
    id: "pharmacie-soins-maluku",
    countryCode: "CD",
    name: "Pharmacie & Soins Maluku",
    tagline: "Santé, Hygiène & Parapharmacie Certifiée",
    category: "Beauté & Santé",
    city: "Kinshasa",
    province: "Kinshasa",
    rating: 4.9,
    reviewCount: 110,
    productCount: 125,
    verified: true,
    topSeller: false,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgUeMQPo6fLGbXbFYDbG76bGBhkpjK-N1NcbzhLuu1HPbmGnKM-nP4w_TVtx4LQd-FMiNkDj3Yk7NixZCTKpWWEgHlcaV01HQF0j64fLusJG6x7qjdHve4k-jf_TK2C3ycQ-XT8FtvsQPDKA89XzcMidf4WsCksyEzHdTnvSD_bPM9mNtrNplTXhAdOXL9A6rmElUudfeTaL60SPmIo0voTJ8bIdgvB5i9hNTCI_nQgWTkAcrqO7rA",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgUeMQPo6fLGbXbFYDbG76bGBhkpjK-N1NcbzhLuu1HPbmGnKM-nP4w_TVtx4LQd-FMiNkDj3Yk7NixZCTKpWWEgHlcaV01HQF0j64fLusJG6x7qjdHve4k-jf_TK2C3ycQ-XT8FtvsQPDKA89XzcMidf4WsCksyEzHdTnvSD_bPM9mNtrNplTXhAdOXL9A6rmElUudfeTaL60SPmIo0voTJ8bIdgvB5i9hNTCI_nQgWTkAcrqO7rA",
    bio: "Officine pharmaceutique agréée en RDC. Produits parapharmaceutiques, compléments alimentaires, soins maman & bébé, et trousses de premiers secours expédiables partout.",
    fullAddress: "Route Nationale 1, Commune de Maluku, Kinshasa, RDC",
    shippingSpeed: "Expédié sous 24h",
    coveredTerritories: "Kinshasa & provinces",
    openingHours: "24h/24, 7j/7",
    phone: "+243 82 100 2000",
    responseRate: "100%",
    yearEstablished: "2018",
    performanceScore: {
      overall: "99.6%",
      itemQuality: 5.0,
      communication: 5.0,
      shippingSpeed: 4.9,
    },
    specialties: ["Parapharmacie", "Trousse d'urgence", "Soins Maman & Enfant"],
    productPreviews: [],
  },
  {
    id: "boma-agro-business",
    countryCode: "CD",
    name: "Boma Agro-Business",
    tagline: "Produits Vivriers & Agro-Alimentaire du Mayombe",
    category: "Alimentation & Terroir",
    city: "Boma",
    province: "Kongo Central",
    rating: 4.8,
    reviewCount: 88,
    productCount: 75,
    verified: true,
    topSeller: false,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmXvfXwTplOwxgiJSx77S7jwTTpZ8JC6jwsJkDBxGUAuYb2ISq2w7Dd5KmxiP3VGTqPnQaFJ-XvGGOH4t-BOxDhG_bz6OGLB74m-ihjwpe6I7hvGgxva8brMHKPYTDz6dmidEFXg9OPv14a2nNr_DDXYoPt05RR8OLvBb4dnSgsMvKAgzE4-yJgSKDqVyj1zeKvHxzAq9GB1TKlLWtph7tDGM5vjkclHkTieQNFPxfadZthzHrkJ3x",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmXvfXwTplOwxgiJSx77S7jwTTpZ8JC6jwsJkDBxGUAuYb2ISq2w7Dd5KmxiP3VGTqPnQaFJ-XvGGOH4t-BOxDhG_bz6OGLB74m-ihjwpe6I7hvGgxva8brMHKPYTDz6dmidEFXg9OPv14a2nNr_DDXYoPt05RR8OLvBb4dnSgsMvKAgzE4-yJgSKDqVyj1zeKvHxzAq9GB1TKlLWtph7tDGM5vjkclHkTieQNFPxfadZthzHrkJ3x",
    bio: "Transformation et expédition de denrées alimentaires du terroir du Bas-Fleuve. Huile de palme raffinée, fufu de manioc pur, fruits séchés et café robuste du Mayombe.",
    fullAddress: "Quartier Commercial, Ville de Boma, Kongo Central, RDC",
    shippingSpeed: "Expédition sous 48h",
    coveredTerritories: "Kongo Central, Kinshasa & ports fluviaux",
    openingHours: "Lun - Sam : 08h00 - 17h00",
    phone: "+243 90 333 4455",
    responseRate: "94%",
    yearEstablished: "2017",
    performanceScore: {
      overall: "97.5%",
      itemQuality: 4.8,
      communication: 4.7,
      shippingSpeed: 4.7,
    },
    specialties: ["Farines de Manioc Mayombe", "Huile de Palme Première Pression", "Poissons fumés du fleuve"],
    productPreviews: [],
  },
  {
    id: "kisangani-meubles-bois",
    countryCode: "CD",
    name: "Kisangani Meubles & Bois",
    tagline: "Ebénisterie d'Art & Bois Précieux du Bassin du Congo",
    category: "Maison & Mobilier",
    city: "Kisangani",
    province: "Tshopo",
    rating: 4.9,
    reviewCount: 74,
    productCount: 50,
    verified: true,
    topSeller: false,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcGVvOXoF913IwJEHHVZmbqGO-Xzy70tZwawCxaKO9NTtcjaVJVvK3EmmP87aN_ExPiGqDeyetLkKzatgS2dVSCBTgHdlZ5sp-tdbfivtVmJ0Po2j90kZL1dFQ0CnsViFAEDoIqdSo1-i9bYF1_BRXqXjXNEsQp1_BXqxEh_dNbB55y8nksur5uTGoZ5-M3iYayW9fmW9pDpP3h5tasL87jv9c_PLZVq9bqftcxuOqlLtXyxVnJHw",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcGVvOXoF913IwJEHHVZmbqGO-Xzy70tZwawCxaKO9NTtcjaVJVvK3EmmP87aN_ExPiGqDeyetLkKzatgS2dVSCBTgHdlZ5sp-tdbfivtVmJ0Po2j90kZL1dFQ0CnsViFAEDoIqdSo1-i9bYF1_BRXqXjXNEsQp1_BXqxEh_dNbB55y8nksur5uTGoZ5-M3iYayW9fmW9pDpP3h5tasL87jv9c_PLZVq9bqftcxuOqlLtXyxVnJHw",
    bio: "Manufacture d'ébénisterie artisanale à Kisangani. Meubles massifs façonnés dans les essences précieuses de la forêt équatoriale (Afrormosia, Iroko, Wengé). Conditionnement pour transport fluvial et aérien.",
    fullAddress: "Boulevard Lumumba, Commune Makiso, Kisangani, Tshopo, RDC",
    shippingSpeed: "Expédition sous 72h via hub fluvial / cargo",
    coveredTerritories: "Tshopo, Kinshasa & corridors interprovinciaux",
    openingHours: "Lun - Sam : 08h00 - 17h00",
    phone: "+243 84 111 2233",
    responseRate: "95%",
    yearEstablished: "2016",
    performanceScore: {
      overall: "98.5%",
      itemQuality: 5.0,
      communication: 4.8,
      shippingSpeed: 4.6,
    },
    specialties: ["Salons en Wengé", "Portes Sculptées Traditionnelles", "Lits Baldaquins"],
    productPreviews: [],
  },

  // ─── BOUTIQUES DE DÉMONSTRATION (MARCHÉS AFRICAINS - PHASE 1 FONDATIONS) ───────────
  // Démo 1 : Congo-Brazzaville (CG)
  {
    id: "brazza-wax-couture",
    name: "Brazza Wax & Créations",
    tagline: "Haute Couture & Tissus Africains d'Élite",
    category: "Mode & Habillement",
    countryCode: "CG",
    city: "Brazzaville",
    province: "Brazzaville",
    rating: 4.8,
    reviewCount: 94,
    productCount: 88,
    verified: true,
    topSeller: true,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9_e765_w92y4tWvJ6pYV_4aFqg_d8N5l-1d_2c5kM",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBo4LIqKXAKaCQI7Mm9U7CMse1-xZrTjsF0HV1o7ZEAWdqvGuTZjRu_9r34OcT4TkOmDtC3-yqSXuEs8m7H_F539QDFphwKzP1GM5LwTfPGgy6Q2sqMgLcIX9g8zPvasTcMZVlZJdlnkVzGh5mw_yzJqszKFvTBrzLnhfoWHbaOLDPmR2YUEs0ePHAquMKsFCDyeUiPKnM37wd8t5hqmRpVwxx4313h6A3n7PyxKGNziv7RTGL_IGLq",
    bio: "[DÉMO] Maison de création textile basée à Bacongo, Brazzaville. Spécialisée en tenues d'apparat, pagnes tissés et prêt-à-porter afro-contemporain.",
    fullAddress: "Avenue de l'OUA, Bacongo, Brazzaville, République du Congo",
    shippingSpeed: "Livraison 24h sur Brazzaville & Pointe-Noire",
    coveredTerritories: "Brazzaville, Pointe-Noire, Dolisie",
    openingHours: "Lun - Sam : 08h30 - 18h00",
    phone: "+242 06 123 4567",
    whatsapp: "+242 06 123 4567",
    responseRate: "97%",
    yearEstablished: "2019",
    performanceScore: {
      overall: "98.0%",
      itemQuality: 4.9,
      communication: 4.8,
      shippingSpeed: 4.7,
    },
    specialties: ["Robes Wax", "Chemises Kente", "Accessoires Pagne"],
    productPreviews: [],
  },

  // Démo 2 : Rwanda (RW)
  {
    id: "kigali-solar-tech",
    name: "Kigali Clean Tech & Solar",
    tagline: "Solutions Solaires & Énergies Renouvelables",
    category: "Électronique & Énergie",
    countryCode: "RW",
    city: "Kigali",
    province: "Kigali",
    rating: 4.9,
    reviewCount: 165,
    productCount: 110,
    verified: true,
    topSeller: true,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXLLByVIn37rtgmdlPmOwPB_QkTmusgJfsiBbBzBkw4ssiK7Idg1TsB6yGHTnrwAYqdxILBzA_1nFDYcv62urYJZ905BSIi8JfMcxVvp_37eu7nEj90ivpL7kadVqyWPQ5lULtn3yFkpFCuNd3IJlTQLsgjEWGhEslDtw6t8cQpYyhRIMb-D-PjrvxodB_pFKepmLGnZoHFDJ_HZEUr8Cz_4y4EY7ORXc7GQ7EMj5LxFHX_zOUTkZ1",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuE9_r5T7yU3i1o8p4s6a2f9h0j7k5l3z1x8c4v2",
    bio: "[DÉMO] Équipements solaires certifiés, batteries LiFePO4 et kits d'autonomie énergétique pour l'Afrique de l'Est et les Grands Lacs.",
    fullAddress: "KG 7 Ave, Kacyiru, Kigali, Rwanda",
    shippingSpeed: "Livraison 24h à Kigali, 48h Rubavu & Huye",
    coveredTerritories: "Kigali, Rubavu, Musanze, Huye",
    openingHours: "Lun - Ven : 08h00 - 18h00",
    phone: "+250 788 123 456",
    whatsapp: "+250 788 123 456",
    responseRate: "99%",
    yearEstablished: "2020",
    performanceScore: {
      overall: "99.1%",
      itemQuality: 5.0,
      communication: 4.9,
      shippingSpeed: 4.9,
    },
    specialties: ["Kits Solaires Hybrides", "Batteries Lithium", "Onduleurs"],
    productPreviews: [],
  },

  // Démo 3 : Kenya (KE)
  {
    id: "nairobi-artisan-hub",
    name: "Nairobi Artisan & Leather Hub",
    tagline: "Maroquinerie Pure & Artisanat Kényan d'Exportation",
    category: "Artisanat & Maison",
    countryCode: "KE",
    city: "Nairobi",
    province: "Nairobi",
    rating: 4.7,
    reviewCount: 210,
    productCount: 145,
    verified: true,
    topSeller: true,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDrJq5v8F6kL2g7N9s3tP5rU2wQ1aB8cD4eF6gH",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuG7_h3k5j8m9n2b4v6c8x0z1l3k5j7h9f2d4s6a",
    bio: "[DÉMO] Atelier de maroquinerie artisanale et vannerie swahilie au cœur de Nairobi. Cuir tanné végétal et designs inspirés de la savane.",
    fullAddress: "Ngong Road, Karen, Nairobi, Kenya",
    shippingSpeed: "Same-day Nairobi, 48h Mombasa & Kisumu",
    coveredTerritories: "Nairobi, Mombasa, Nakuru, Kisumu",
    openingHours: "Mon - Sat: 08:30 - 18:30",
    phone: "+254 712 345 678",
    whatsapp: "+254 712 345 678",
    responseRate: "96%",
    yearEstablished: "2018",
    performanceScore: {
      overall: "97.5%",
      itemQuality: 4.8,
      communication: 4.7,
      shippingSpeed: 4.6,
    },
    specialties: ["Sacs Cuir Véritable", "Paniers Sisal Tressés", "Sandales Maasai"],
    productPreviews: [],
  },

  // Démo 4 : Côte d'Ivoire (CI)
  {
    id: "abidjan-elegance-deco",
    name: "Abidjan Élégance & Déco",
    tagline: "Design d'Intérieur & Art de Vivre Ivoirien",
    category: "Maison & Décoration",
    countryCode: "CI",
    city: "Abidjan",
    province: "Abidjan",
    rating: 4.9,
    reviewCount: 132,
    productCount: 95,
    verified: true,
    topSeller: true,
    featured: true,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuF2_d4s6a8h0j2k4l6z8x0c2v4b6n8m0q2w4e6r",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFXW_lq4j67fD5r_s8d5Kq5pU7Y_wQ6r_2t8aB",
    bio: "[DÉMO] Showroom d'ameublement contemporain et artisanat baoulé à Cocody. Luminaires, textiles tissés et céramiques d'art.",
    fullAddress: "Boulevard Latrille, Cocody Deux-Plateaux, Abidjan, Côte d'Ivoire",
    shippingSpeed: "Livraison 24h grand Abidjan",
    coveredTerritories: "Abidjan, Yamoussoukro, Bouaké, San Pedro",
    openingHours: "Lun - Sam : 09h00 - 19h00",
    phone: "+225 07 01 23 45 67",
    whatsapp: "+225 07 01 23 45 67",
    responseRate: "98%",
    yearEstablished: "2021",
    performanceScore: {
      overall: "98.7%",
      itemQuality: 4.9,
      communication: 4.9,
      shippingSpeed: 4.8,
    },
    specialties: ["Pagne Baoulé Tissé", "Sculptures Bronzes", "Luminaires Rotin"],
    productPreviews: [],
  },

  // Démo 5 : Angola (AO)
  {
    id: "luanda-moda-tropical",
    name: "Luanda Moda Tropical",
    tagline: "Estilo Afro-Lusófono Contemporâneo",
    category: "Mode & Habillement",
    countryCode: "AO",
    city: "Luanda",
    province: "Luanda",
    rating: 4.8,
    reviewCount: 78,
    productCount: 65,
    verified: true,
    topSeller: false,
    featured: false,
    bannerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcGVvOXoF913IwJEHHVZmbqGO-Xzy70tZwawCxaKO9NTtcjaVJVvK3EmmP87aN_ExPiGqDeyetLkKzatgS2dVSCBTgHdlZ5sp-tdbfivtVmJ0Po2j90kZL1dFQ0CnsViFAEDoIqdSo1-i9bYF1_BRXqXjXNEsQp1_BXqxEh_dNbB55y8nksur5uTGoZ5-M3iYayW9fmW9pDpP3h5tasL87jv9c_PLZVq9bqftcxuOqlLtXyxVnJHw",
    logoImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4NIPIM8M5YY0iCHRbZSm22rN7KgjNEZJLrvvn7Hb5jdCTYmrIKqfHKVUF-Bws8kHs89GSfuy09phKP4hA8t6qzARBjS2kiA6rfSmKlvmlppApDD1pHX2Rz6myrp7S40cu6jqTgMKJRrBTusl47RocWW5hVxltxedjXffu4Ne6e98iTZMRlhxG3TU4DrYwGtEjB9m5AXsRRJutsAcO-E0YAh02fU3NCEj3XC0NYpf2qMx-nf_yYBbb",
    bio: "[DÉMO] Boutique de moda urbana e tradicional em Luanda. Confeções com samakaka e tecidos africanos premium com toque lusófono.",
    fullAddress: "Rua Rainha Ginga, Ingombota, Luanda, Angola",
    shippingSpeed: "Entrega em 24h-48h em Luanda",
    coveredTerritories: "Luanda, Benguela, Huambo",
    openingHours: "Seg - Sáb: 08:30 - 18:00",
    phone: "+244 923 123 456",
    whatsapp: "+244 923 123 456",
    responseRate: "95%",
    yearEstablished: "2022",
    performanceScore: {
      overall: "97.0%",
      itemQuality: 4.8,
      communication: 4.7,
      shippingSpeed: 4.5,
    },
    specialties: ["Vestidos Samakaka", "Camisas Linho Africano", "Bijuteria Étnica"],
    productPreviews: [],
  },
];

export function getShopById(id: string): Shop | undefined {
  return SHOPS_DATA.find((s) => s.id === id);
}

export function getShopIdByName(name: string): string {
  const normalized = (name || "").toLowerCase();
  if (normalized.includes("kin fashion")) return "kin-fashion";
  if (normalized.includes("kazi tech") || normalized.includes("kazi")) return "kazi-tech";
  if (normalized.includes("solaris")) return "solaris-rdc";
  if (normalized.includes("mode") || normalized.includes("lubum")) return "mode-elegance";
  if (normalized.includes("maison") || normalized.includes("déco") || normalized.includes("deco")) return "maison-deco-goma";
  if (normalized.includes("saveurs") || normalized.includes("kivu")) return "saveurs-du-kivu";
  if (normalized.includes("kin bourse")) return "kin-bourse-high-tech";
  if (normalized.includes("pharmacie") || normalized.includes("maluku")) return "pharmacie-soins-maluku";
  if (normalized.includes("boma")) return "boma-agro-business";
  if (normalized.includes("kisangani")) return "kisangani-meubles-bois";
  return "kazi-tech";
}
