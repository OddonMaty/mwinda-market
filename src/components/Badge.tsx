import React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Sparkles, Zap, Globe, CheckCircle2, Flame, Award } from "lucide-react";

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
        <ShadcnBadge
          variant="accent"
          size="sm"
          className={`font-bold tracking-tight bg-accent text-accent-foreground shadow-sm ${className}`}
        >
          {text || "-20%"}
        </ShadcnBadge>
      );

    case "express":
      return (
        <ShadcnBadge
          variant="default"
          size="sm"
          className={`bg-brand-navy text-white font-medium flex items-center gap-1 shadow-xs ${className}`}
        >
          <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>{text || "Kinshasa Express"}</span>
        </ShadcnBadge>
      );

    case "interprovincial":
      return (
        <ShadcnBadge
          variant="secondary"
          size="sm"
          className={`font-medium flex items-center gap-1 ${className}`}
        >
          <Globe className="w-2.5 h-2.5 shrink-0" />
          <span>{text || "Interprovincial"}</span>
        </ShadcnBadge>
      );

    case "verified":
      return (
        <ShadcnBadge
          variant="success"
          size="sm"
          className={`flex items-center gap-1 ${className}`}
        >
          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
          <span>{text || "Vérifié"}</span>
        </ShadcnBadge>
      );

    case "essential":
      return (
        <ShadcnBadge
          variant="outline"
          size="sm"
          className={`bg-white/95 text-slate-700 font-medium border-slate-200/80 flex items-center gap-1 ${className}`}
        >
          <Sparkles className="w-2.5 h-2.5 text-brand-blue shrink-0" />
          <span>{text || "Essentiel"}</span>
        </ShadcnBadge>
      );

    case "origin-rdc":
      return (
        <ShadcnBadge
          variant="subtle"
          size="sm"
          className={`text-slate-800 font-medium flex items-center gap-1 ${className}`}
        >
          <Award className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
          <span>{text || "Origine RDC"}</span>
        </ShadcnBadge>
      );

    case "top-sale":
      return (
        <ShadcnBadge
          variant="accent"
          size="sm"
          className={`bg-rose-500 text-white font-semibold flex items-center gap-1 ${className}`}
        >
          <Flame className="w-2.5 h-2.5 shrink-0" />
          <span>{text || "Top Vente"}</span>
        </ShadcnBadge>
      );

    default:
      return (
        <ShadcnBadge variant="outline" size="sm" className={className}>
          {text}
        </ShadcnBadge>
      );
  }
};
