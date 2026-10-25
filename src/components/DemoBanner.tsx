"use client";

import React, { useEffect, useState } from "react";
import { DEMO_MODE } from "@/config/demo";
import { useT } from "@/i18n";

export const DemoBanner: React.FC = () => {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!DEMO_MODE) return;
    try {
      const isDismissed = sessionStorage.getItem("mwinda_demo_banner_dismissed");
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!DEMO_MODE || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("mwinda_demo_banner_dismissed", "1");
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  return (
    <aside
      aria-label="Mode démonstration"
      className="w-full bg-amber-500 text-slate-950 px-4 py-1 text-[11px] sm:text-xs font-medium flex items-center justify-between border-b border-amber-600/40 relative z-50 select-none"
    >
      <div className="flex-1 flex items-center justify-center gap-1.5 text-center px-2">
        <span className="material-symbols-outlined text-sm sm:text-base shrink-0">info</span>
        <span>
          {t("demo.banner_notice") ||
            "Version de démonstration : les commandes, paiements et inscriptions ne sont pas encore actifs"}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fermer le bandeau de démonstration pour cette session"
        className="shrink-0 p-0.5 hover:bg-black/10 rounded transition-colors text-slate-950 ml-2"
      >
        <span className="material-symbols-outlined text-sm leading-none block">close</span>
      </button>
    </aside>
  );
};
