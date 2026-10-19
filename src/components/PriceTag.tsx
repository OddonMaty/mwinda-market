"use client";

import React from "react";
import { useMarket } from "@/context/MarketContext";
import { convertUsdToCurrency, formatLocalPrice } from "@/lib/currency";

interface PriceTagProps {
  usdPrice: number;
  originalUsdPrice?: number;
  rate?: number; // CDF per USD (fallback optionnel)
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  usdPrice,
  originalUsdPrice,
  rate = 2800,
  size = "md",
  className = "",
}) => {
  // Récupérer le contexte du marché si disponible
  let marketCurrency = { code: "CDF", symbol: "FC", name: "Franc congolais" };
  let isRdcMarket = true;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const market = useMarket();
    if (market) {
      marketCurrency = market.currency;
      isRdcMarket = market.isRDC;
    }
  } catch {
    // Fallback gracieux si utilisé hors du provider
  }

  const priceSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl lg:text-3xl",
  };

  // Comportement RDC (Comportement historique conservé à 100% à l'identique)
  if (isRdcMarket || marketCurrency.code === "CDF") {
    const cdfPrice = Math.round((usdPrice * rate) / 100) * 100;
    const formattedCdf = new Intl.NumberFormat("fr-CD").format(cdfPrice).replace(/\u202F/g, " ");

    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-baseline gap-1.5">
          <span className={`${priceSizes[size]} font-bold text-primary tnum leading-tight`}>
            {usdPrice} $
          </span>
          {originalUsdPrice && originalUsdPrice > usdPrice && (
            <span className="text-xs sm:text-sm text-disabled line-through tnum">
              {originalUsdPrice} $
            </span>
          )}
        </div>
        <p suppressHydrationWarning className="text-xs text-on-surface-variant font-medium tnum tracking-tight mt-0.5">
          ~ {formattedCdf} CDF
        </p>
      </div>
    );
  }

  // Comportement Marchés Africains Internationaux (Congo-Brazza, Rwanda, Kenya, Côte d'Ivoire, Angola...)
  const convertedCurrent = convertUsdToCurrency(usdPrice, marketCurrency.code);
  const formattedLocal = formatLocalPrice(convertedCurrent, marketCurrency.code, marketCurrency.symbol);

  const convertedOriginal = originalUsdPrice
    ? convertUsdToCurrency(originalUsdPrice, marketCurrency.code)
    : null;
  const formattedOriginal = convertedOriginal
    ? formatLocalPrice(convertedOriginal, marketCurrency.code, marketCurrency.symbol)
    : null;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-1.5">
        <span suppressHydrationWarning className={`${priceSizes[size]} font-bold text-primary tnum leading-tight`}>
          {formattedLocal}
        </span>
        {formattedOriginal && (
          <span suppressHydrationWarning className="text-xs sm:text-sm text-disabled line-through tnum">
            {formattedOriginal}
          </span>
        )}
      </div>
      <p className="text-xs text-on-surface-variant font-medium tnum tracking-tight mt-0.5">
        ~ {usdPrice} $ USD
      </p>
    </div>
  );
};
