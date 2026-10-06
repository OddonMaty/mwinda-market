import React from "react";

export type BadgeVariant =
  | "discount"
  | "express"
  | "interprovincial"
  | "verified"
  | "essential"
  | "origin-rdc"
  | "top-sale";

interface BadgeProps {
  variant: BadgeVariant;
  text?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, text, className = "" }) => {
  switch (variant) {
    case "discount":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-tertiary text-white ${className}`}
        >
          {text || "-20%"}
        </span>
      );

    case "express":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary text-secondary-fixed-dim ${className}`}
        >
          {text || "Kinshasa Express"}
        </span>
      );

    case "interprovincial":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed text-on-secondary-container ${className}`}
        >
          {text || "Interprovincial"}
        </span>
      );

    case "verified":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-fixed text-on-secondary-container ${className}`}
        >
          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
          {text || "Certifié Mwinda"}
        </span>
      );

    case "essential":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-secondary text-white ${className}`}
        >
          {text || "Essentiel"}
        </span>
      );

    case "origin-rdc":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-highest text-on-surface ${className}`}
        >
          {text || "Authentique RDC"}
        </span>
      );

    case "top-sale":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary text-secondary-container ${className}`}
        >
          {text || "Top Vente"}
        </span>
      );

    default:
      return null;
  }
};
