"use client";

import { useMarket } from "@/context/MarketContext";
import fr from "./fr.json";
import en from "./en.json";
import pt from "./pt.json";
import sw from "./sw.json";

export type Translations = typeof fr;

type DictNode = Record<string, unknown>;

const DICTIONARIES: Record<string, DictNode> = {
  fr: fr as unknown as DictNode,
  en: en as unknown as DictNode,
  pt: pt as unknown as DictNode,
  sw: sw as unknown as DictNode,
};

/**
 * Hook de traduction ultra-léger basé sur MarketContext.
 * Si une clé n'est pas encore traduite dans la langue choisie,
 * fallback transparent sur le français.
 * Prévu pour intégrer sans refonte de futures langues (ar avec RTL, ln, rw, etc.).
 */
export function useT() {
  const { language } = useMarket();

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");

    // 1. Tenter dans la langue active
    const dict = DICTIONARIES[language] || DICTIONARIES.fr;
    let current: unknown = dict;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as DictNode)[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (typeof current === "string") {
      return current;
    }

    // 2. Fallback sur le français si différent
    if (language !== "fr") {
      let frCurrent: unknown = DICTIONARIES.fr;
      for (const key of keys) {
        if (frCurrent && typeof frCurrent === "object" && key in frCurrent) {
          frCurrent = (frCurrent as DictNode)[key];
        } else {
          frCurrent = undefined;
          break;
        }
      }
      if (typeof frCurrent === "string") {
        return frCurrent;
      }
    }

    // 3. Fallback textuel explicite ou chemin de la clé
    return fallback || path;
  };

  return { t, language };
}
