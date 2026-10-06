"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Country, Currency, AFRICAN_COUNTRIES } from "@/data/countries";
import { getCountryByCode } from "@/lib/activeCountries";

export type SupportedLanguage = "fr" | "en" | "pt" | "sw";

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

const DEFAULT_COUNTRY_CODE = "CD"; // RDC (Zone phare)
const STORAGE_COUNTRY_KEY = "mwinda_market_country";
const STORAGE_LANG_KEY = "mwinda_market_lang";

interface MarketContextType {
  country: Country;
  currency: Currency;
  language: SupportedLanguage;
  setCountry: (countryCode: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  availableLanguages: SupportedLanguage[];
  isRDC: boolean;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Détermine la meilleure langue supportée pour un pays donné
function resolveBestLanguage(country: Country): SupportedLanguage {
  const supportedCodes: SupportedLanguage[] = ["fr", "en", "pt", "sw"];

  // 1. Si la langue par défaut du pays est directement supportée
  if (supportedCodes.includes(country.defaultLanguage as SupportedLanguage)) {
    return country.defaultLanguage as SupportedLanguage;
  }

  // 2. Sinon, première langue officielle du pays supportée
  const match = country.languages.find((l) => supportedCodes.includes(l as SupportedLanguage));
  if (match) {
    return match as SupportedLanguage;
  }

  // 3. Fallback standard
  return "fr";
}

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultCountry = useMemo(() => {
    return getCountryByCode(DEFAULT_COUNTRY_CODE) || AFRICAN_COUNTRIES[0];
  }, []);

  const [country, setCountryState] = useState<Country>(defaultCountry);
  const [language, setLanguageState] = useState<SupportedLanguage>("fr");

  // Initialisation côté client depuis localStorage
  useEffect(() => {
    try {
      const savedCountryCode = localStorage.getItem(STORAGE_COUNTRY_KEY);
      const savedLang = localStorage.getItem(STORAGE_LANG_KEY) as SupportedLanguage | null;

      let activeCountry = defaultCountry;
      if (savedCountryCode) {
        const found = getCountryByCode(savedCountryCode);
        if (found) activeCountry = found;
      }

      setCountryState(activeCountry);

      if (savedLang && ["fr", "en", "pt", "sw"].includes(savedLang)) {
        setLanguageState(savedLang);
      } else {
        setLanguageState(resolveBestLanguage(activeCountry));
      }
    } catch {
      // Ignorer si localStorage n'est pas disponible
    }
  }, [defaultCountry]);

  // Synchroniser l'attribut `lang` du document HTML
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Changer de pays
  const setCountry = (countryCode: string) => {
    const found = getCountryByCode(countryCode);
    if (!found) return;

    setCountryState(found);
    const newLang = resolveBestLanguage(found);
    setLanguageState(newLang);

    try {
      localStorage.setItem(STORAGE_COUNTRY_KEY, found.code);
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // Ignorer
    }
  };

  // Changer de langue manuellement
  const setLanguage = (newLang: SupportedLanguage) => {
    if (!["fr", "en", "pt", "sw"].includes(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // Ignorer
    }
  };

  // Langues suggérées pour le pays courant (langues du pays compatibles + fallback)
  const availableLanguages = useMemo(() => {
    const supportedCodes: SupportedLanguage[] = ["fr", "en", "pt", "sw"];
    const countrySupported = country.languages.filter((l) =>
      supportedCodes.includes(l as SupportedLanguage)
    ) as SupportedLanguage[];

    // Si aucune langue du pays n'est dans nos 4 langues, on propose les 4 langues
    if (countrySupported.length === 0) {
      return supportedCodes;
    }

    // Toujours inclure fr et en dans les options pour l'ergonomie
    const merged = Array.from(new Set([...countrySupported, "fr", "en"])) as SupportedLanguage[];
    return merged;
  }, [country]);

  const currency = country.currency;
  const isRDC = country.code === "CD";

  return (
    <MarketContext.Provider
      value={{
        country,
        currency,
        language,
        setCountry,
        setLanguage,
        availableLanguages,
        isRDC,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
};
