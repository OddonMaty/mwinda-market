"use client";

import React, { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { CONTACT_CONFIG } from "@/config/contact";

export const FloatingBar: React.FC = () => {
  const [showTop, setShowTop] = useState(false);
  const { t } = useT();

  useEffect(() => {
    const handler = () => {
      const top = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowTop(top > 300);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const whatsapp = CONTACT_CONFIG.whatsappLink;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      aria-label="Actions rapides"
      className="hidden lg:flex fixed right-4 bottom-8 z-40 flex-col items-center gap-2"
    >
      {/* Support button */}
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:bg-[#1db954] transition-all hover:scale-105 active:scale-95"
        title={t("floatbar.float_support")}
        aria-label={t("floatbar.float_support")}
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
      </a>

      {/* Back to top — only visible after scroll */}
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-200"
          title={t("floatbar.float_top")}
          aria-label={t("floatbar.float_top")}
        >
          <span className="material-symbols-outlined text-2xl">arrow_upward</span>
        </button>
      )}
    </div>
  );
};
