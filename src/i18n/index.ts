"use client";

import { useMarket } from "@/context/MarketContext";
import fr from "./fr.json";
import en from "./en.json";

export type Translations = typeof fr;

type DictNode = Record<string, unknown>;

const DICTIONARIES: Record<string, DictNode> = {
  fr: fr as unknown as DictNode,
  en: en as unknown as DictNode,
};

/**
 * Traduction FR / EN uniquement.
 * Fallback sur le français si clé manquante.
 */
export function useT() {
  const { language } = useMarket();

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");

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

    if (typeof current === "string") return current;

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
      if (typeof frCurrent === "string") return frCurrent;
    }

    return fallback || path;
  };

  return { t, language };
}
